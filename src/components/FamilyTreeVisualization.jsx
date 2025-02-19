/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react';
import Tree from 'react-d3-tree';
import { Box, Paper, Typography } from '@mui/material';
import { supabase } from '../lib/supabase';

const FamilyTreeVisualization = ({ familyId }) => {
  const [treeData, setTreeData] = useState(null);

  useEffect(() => {
    loadFamilyData();
  }, [familyId]);

  const loadFamilyData = async () => {
    try {
      // Load family members with relationships
      const { data: members, error } = await supabase
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
        .eq('family_id', familyId);

      if (error) throw error;

      // Transform data into hierarchical structure
      const rootMember = members.find((m) =>
        m.relation.toLowerCase().includes('self')
      );
      if (rootMember) {
        const hierarchicalData = buildHierarchy(rootMember, members);
        setTreeData(hierarchicalData);
      }
    } catch (error) {
      console.error('Error loading family data:', error);
    }
  };

  const buildHierarchy = (member, allMembers, visited = new Set()) => {
    if (visited.has(member.id)) return null; // Prevent cycles
    visited.add(member.id);

    const node = {
      name: member.name,
      attributes: {
        birth_date: member.birth_date || 'Unknown',
        occupation: member.occupation || 'Unknown',
      },
      children: [],
    };

    // Get all relationships for this member
    const relationships = allMembers.filter((m) =>
      m.relationships?.some(
        (r) => r.person1_id === member.id || r.person2_id === member.id
      )
    );

    relationships.forEach((relatedMember) => {
      const childNode = buildHierarchy(relatedMember, allMembers, visited);
      if (childNode) {
        node.children.push(childNode);
      }
    });

    return node;
  };

  if (!treeData) {
    return <Typography>Loading family tree...</Typography>;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        height: '70vh',
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Tree
        data={treeData}
        orientation='vertical'
        pathFunc='step'
        translate={{ x: 400, y: 50 }}
        nodeSize={{ x: 200, y: 100 }}
        separation={{ siblings: 2, nonSiblings: 3 }}
        renderCustomNodeElement={({ nodeDatum }) => (
          <g>
            <circle r={20} fill='#8B7355' />
            <text
              dy='.35em'
              x={30}
              style={{ fill: '#2d3748', fontSize: '14px' }}
            >
              {nodeDatum.name}
            </text>
            <text
              dy='1.75em'
              x={30}
              style={{ fill: '#4a5568', fontSize: '12px' }}
            >
              {nodeDatum.attributes.relation}
            </text>
          </g>
        )}
      />
    </Paper>
  );
};

export default FamilyTreeVisualization;
