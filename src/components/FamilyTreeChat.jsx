/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Paper, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { supabase } from '../lib/supabase';
import LoadingBubble from './LoadingBubble';
import AnimatedMessage from './AnimatedMessage';

const FamilyTreeChat = ({ familyId, messages, setMessages }) => {
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

  const checkExistingMember = async (memberInfo) => {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', familyId)
      .ilike('name', memberInfo.name) // Case-insensitive name comparison
      .eq('relation', memberInfo.relation);

    if (error) {
      console.error('Error checking existing member:', error);
      return false;
    }

    return data.length > 0;
  };

  const saveFamilyMember = async (memberInfo) => {
    try {
      // First check if member already exists by name
      const { data: existingMember } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', familyId)
        .ilike('name', memberInfo.name)
        .single();

      let member = existingMember;

      if (!existingMember) {
        // Save new member if they don't exist
        const { data: newMember, error: memberError } = await supabase
          .from('family_members')
          .insert([
            {
              family_id: familyId,
              name: memberInfo.name,
              birth_date: memberInfo.birth_date || null,
              occupation: memberInfo.occupation || null,
            },
          ])
          .select()
          .single();

        if (memberError) throw memberError;
        member = newMember;
      }

      // Handle relationships
      if (memberInfo.relationships && memberInfo.relationships.length > 0) {
        for (const rel of memberInfo.relationships) {
          // Find the related member
          const { data: relatedMember } = await supabase
            .from('family_members')
            .select('id')
            .eq('family_id', familyId)
            .ilike('name', rel.to_name)
            .single();

          if (relatedMember) {
            // Create bidirectional relationships
            await supabase.from('relationships').upsert([
              {
                family_id: familyId,
                person1_id: member.id,
                person2_id: relatedMember.id,
                relationship_type: rel.type,
              },
              {
                family_id: familyId,
                person1_id: relatedMember.id,
                person2_id: member.id,
                relationship_type: getInverseRelation(rel.type),
              },
            ]);
          }
        }
      }

      return member;
    } catch (error) {
      console.error('Error saving family member:', error);
      throw error;
    }
  };

  // Helper function to get inverse relationship
  const getInverseRelation = (relationType) => {
    const inverseMap = {
      parent: 'child',
      child: 'parent',
      sibling: 'sibling',
      spouse: 'spouse',
    };
    return inverseMap[relationType] || relationType;
  };

  const getMemberCount = async () => {
    const { count, error } = await supabase
      .from('family_members')
      .select('*', { count: 'exact' })
      .eq('family_id', familyId);

    if (error) throw error;
    return count;
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

  // Add this function to check for family connections
  const findFamilyConnection = (name) => {
    // Case-insensitive name comparison
    name = name.toLowerCase().trim();

    // Check direct matches
    const directMatch = familyMembers.find(
      (m) =>
        m.name.toLowerCase().includes(name) ||
        name.includes(m.name.toLowerCase())
    );

    // Check relations in member info
    const relationMatch = familyMembers.find(
      (m) =>
        m.relation.toLowerCase().includes(name) ||
        (m.relation.toLowerCase().includes('to') &&
          m.relation.toLowerCase().split('to')[1].trim().includes(name))
    );

    return directMatch || relationMatch;
  };

  // Update the identifyUser function
  const identifyUser = async (message) => {
    const jsonMatch = message.match(/<json>([\s\S]*?)<\/json>/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        if (data.action === 'identify_user') {
          const user = data.user;

          // Check if this person is already connected to the family
          const connection = findFamilyConnection(user.name);
          if (connection) {
            // Save user to database
            const { error } = await supabase
              .from('families')
              .update({ current_user: user })
              .eq('id', familyId);

            if (error) throw error;

            setCurrentUser(user);
            return true;
          } else {
            console.log('No family connection found for:', user.name);
            return false;
          }
        }
      } catch (error) {
        console.error('Error processing user identification:', error);
      }
    }
    return false;
  };

  // Update the system prompt to be more specific about relationships
  const getSystemPrompt = () => {
    if (!currentUser) {
      const existingMembers = familyMembers
        .map((m) => `- ${m.name}`)
        .join('\n');

      return `You are helping build a family tree. When someone introduces themselves, ask about their relationship to existing members.

Existing members:
${existingMembers}

When they identify themselves, include their info as:
<json>{"action":"identify_user","user":{"name":"exact_full_name"}}</json>`;
    }

    // Get existing relationships for context
    const familyContext = familyMembers
      .map((member) => {
        const relations = member.relationships
          ?.map((r) => {
            const relatedMember = familyMembers.find(
              (m) => m.id === r.person2_id
            );
            if (!relatedMember) return null;
            return `${relatedMember.name} (${r.relationship_type})`;
          })
          .filter(Boolean);

        return `${member.name} - Related to: ${
          relations?.join(', ') || 'no relations yet'
        }`;
      })
      .join('\n');

    return `You are helping ${currentUser.name} build their family tree.

Current family structure:
${familyContext}

When adding a new member:
1. First confirm if they're already in the tree
2. Ask specific questions about their relationships to existing members
3. Get complete information before adding

Valid relationship types are:
- parent/child (for direct parent-child relationships)
- spouse (for married couples)
- sibling (for brothers and sisters)
- grandparent/grandchild
- aunt/uncle and niece/nephew
- cousin

When adding a new member, include their info as:
<json>{
  "action": "add_member",
  "member": {
    "name": "full_name",
    "birth_date": "YYYY-MM-DD",
    "occupation": "occupation",
    "relationships": [
      {
        "to_name": "exact_name_of_existing_member",
        "type": "one_of_valid_relationship_types"
      }
    ]
  }
}</json>

Important:
- Always verify exact names with user
- Create all relevant family connections
- Ask follow-up questions about relationships
- Keep conversation natural
- Never show JSON in messages`;
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

      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

      // Debug log - remove in production
      console.log('API Key exists:', !!apiKey);

      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
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
            max_tokens: 300,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(
          `API Error: ${errorData.error?.message || response.statusText}`
        );
      }

      const data = await response.json();
      console.log('OpenAI Response:', data);

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
            if (familyData.action === 'add_member' && familyData.member) {
              await saveFamilyMember(familyData.member);
              await loadFamilyData(); // Reload the family data to update the context
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
      {error && (
        <Box sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography>Error: {error}</Typography>
        </Box>
      )}
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
                  boxShadow: '0 0 0 2px rgba(139, 115, 85, 0.2)',
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
