/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Paper, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { supabase } from '../lib/supabase';
import LoadingBubble from './LoadingBubble';
import AnimatedMessage from './AnimatedMessage';

const FamilyTreeChat = ({ familyId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const messagesEndRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load family members and current user when component mounts
  useEffect(() => {
    loadFamilyData();
  }, [familyId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadFamilyData = async () => {
    try {
      // Load family data including current_user
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('*, current_user')
        .eq('id', familyId)
        .single();

      if (familyError) throw familyError;

      // Set current user if exists
      if (familyData.current_user) {
        setCurrentUser(familyData.current_user);
      }

      // Load family members
      const { data: membersData, error: membersError } = await supabase
        .from('family_members')
        .select(
          `
          *,
          relationships:relationships!person1_id(
            person2_id,
            relationship_type
          )
        `
        )
        .eq('family_id', familyId)
        .order('created_at', { ascending: true });

      if (membersError) throw membersError;
      setFamilyMembers(membersData || []);

      // Create a more detailed family context
      const familyContext = membersData
        ?.map((member) => {
          const relations = member.relationships
            ?.map((r) => `${r.relationship_type} of ${r.person2_id}`)
            .join(', ');
          return `${member.name} (${member.relation})${
            relations ? ` - ${relations}` : ''
          }`;
        })
        .join('\n');

      console.log('Family Context:', familyContext);
    } catch (error) {
      console.error('Error loading family data:', error);
    }
  };

  const saveFamilyMember = async (memberInfo) => {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .insert([
          {
            ...memberInfo,
            family_id: familyId,
          },
        ])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error saving family member:', error);
      throw error;
    }
  };

  const saveRelationship = async (relationship) => {
    try {
      const { error } = await supabase
        .from('relationships')
        .insert([relationship]);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving relationship:', error);
      throw error;
    }
  };

  const identifyUser = async (message) => {
    const jsonMatch = message.match(/<json>([\s\S]*?)<\/json>/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        if (data.action === 'identify_user') {
          // Save user to database
          const { error } = await supabase
            .from('families')
            .update({ current_user: data.user })
            .eq('id', familyId);

          if (error) throw error;

          setCurrentUser(data.user);
          return true;
        }
      } catch (error) {
        console.error('Error processing user identification:', error);
      }
    }
    return false;
  };

  const getSystemPrompt = () => {
    if (!currentUser) {
      return `Ask for user's name and relation to this family tree. Extract as:
<json>{"action":"identify_user","user":{"name":"name","relation":"relation"}}</json>`;
    }

    // For returning users, only include immediate family members
    const relevantMembers = familyMembers
      .filter((m) =>
        [
          'father',
          'mother',
          'brother',
          'sister',
          'spouse',
          'son',
          'daughter',
        ].includes(m.relation.toLowerCase())
      )
      .map((m) => `${m.name} (${m.relation})`)
      .join('\n');

    return `You're helping ${currentUser.name} (${
      currentUser.relation
    }) build their family tree.
${relevantMembers ? `\nImmediate family:\n${relevantMembers}` : ''}
Extract new family info as:
<json>{"action":"add_member","member":{"name":"","birth_date":"YYYY-MM-DD","relation":"to ${
      currentUser.name
    }","occupation":""}}</json>`;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    setError(null);
    setLoading(true);
    try {
      const userMessage = {
        content: input,
        role: 'user',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');

      // Only include last 3 messages for context
      const recentMessages = messages.slice(-3).map((msg) => ({
        role: msg.role,
        content: msg.content.slice(0, 200), // Limit message length
      }));

      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: getSystemPrompt(),
              },
              ...recentMessages,
              {
                role: 'user',
                content: input,
              },
            ],
            temperature: 0.7,
            max_tokens: 300, // Limit response length
          }),
        }
      );

      const data = await response.json();
      console.log('OpenAI Response:', data);

      if (!response.ok) {
        throw new Error(
          `API Error: ${data.error?.message || response.statusText}`
        );
      }

      const aiMessage = data.choices[0].message.content;

      // First check if this is a user identification
      if (!currentUser && identifyUser(aiMessage)) {
        // Remove the JSON and show the clean message
        const cleanMessage = aiMessage
          .replace(/<json>[\s\S]*?<\/json>/, '')
          .trim();
        setMessages((prev) => [
          ...prev,
          {
            content: cleanMessage,
            role: 'assistant',
            timestamp: new Date().toISOString(),
          },
        ]);
        return;
      }

      // If user is identified, proceed with family member extraction
      if (currentUser) {
        try {
          const jsonMatch = aiMessage.match(/<json>([\s\S]*?)<\/json>/);
          if (jsonMatch) {
            const familyData = JSON.parse(jsonMatch[1]);
            if (familyData.member) {
              const savedMember = await saveFamilyMember(familyData.member);
              console.log('Saved family member:', savedMember);
              await loadFamilyData();
            }
          }
        } catch (error) {
          console.error('Error processing family data:', error);
        }
      }

      // Show the clean message
      const cleanMessage = aiMessage
        .replace(/<json>[\s\S]*?<\/json>/, '')
        .trim();
      setMessages((prev) => [
        ...prev,
        {
          content: cleanMessage,
          role: 'assistant',
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Full error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        height: '70vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 3,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#cbd5e0',
            borderRadius: '3px',
            '&:hover': {
              background: '#a0aec0',
            },
          },
        }}
      >
        {messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent:
                message.role === 'user' ? 'flex-end' : 'flex-start',
              mb: 2,
            }}
          >
            <AnimatedMessage
              message={message}
              isUser={message.role === 'user'}
            />
          </Box>
        ))}
        {loading && (
          <Box sx={{ display: 'flex', mb: 2 }}>
            <LoadingBubble />
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'grey.50',
        }}
      >
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            variant='outlined'
            placeholder='Type your message...'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) =>
              e.key === 'Enter' && !e.shiftKey && !loading && handleSend()
            }
            multiline
            maxRows={4}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.paper',
                '&.Mui-focused': {
                  boxShadow: '0 0 0 2px rgba(63, 81, 181, 0.2)',
                },
              },
            }}
            disabled={loading}
          />
          <Button
            variant='contained'
            color='primary'
            endIcon={<SendIcon />}
            onClick={handleSend}
            disabled={loading}
            sx={{
              px: 4,
              minWidth: '120px',
              height: '56px',
            }}
          >
            {loading ? 'Sending...' : 'Send'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default FamilyTreeChat;
