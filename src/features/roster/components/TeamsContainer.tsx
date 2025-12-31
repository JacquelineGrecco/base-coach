'use client';

import React, { useState } from 'react';
import TeamHierarchy from './TeamHierarchy';
import TeamDetail from './TeamDetail';
import Players from './Players';

type TeamView = 'hierarchy' | 'detail' | 'players';

interface TeamsContainerProps {
  onUpgradeClick?: () => void;
}

const TeamsContainer: React.FC<TeamsContainerProps> = ({ onUpgradeClick }) => {
  const [currentView, setCurrentView] = useState<TeamView>('hierarchy');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');

  function handleViewTeamDetail(teamId: string) {
    setSelectedTeamId(teamId);
    setCurrentView('detail');
  }

  function handleViewPlayers(teamId: string, categoryId: string | null, categoryName: string) {
    setSelectedTeamId(teamId);
    setSelectedCategoryId(categoryId);
    setSelectedCategoryName(categoryName);
    setCurrentView('players');
  }

  function handleBackToHierarchy() {
    setCurrentView('hierarchy');
    setSelectedTeamId(null);
    setSelectedCategoryId(null);
  }

  function handleBackToTeamDetail() {
    setCurrentView('detail');
    setSelectedCategoryId(null);
  }

  // Legacy handler for TeamDetail component
  function handleViewPlayersFromDetail(categoryId: string | null, categoryName: string) {
    if (selectedTeamId) {
      handleViewPlayers(selectedTeamId, categoryId, categoryName);
    }
  }

  switch (currentView) {
    case 'hierarchy':
      return (
        <TeamHierarchy
          onViewTeamDetail={handleViewTeamDetail}
          onViewPlayers={handleViewPlayers}
          onUpgradeClick={onUpgradeClick}
        />
      );
    
    case 'detail':
      if (!selectedTeamId) {
        return (
          <TeamHierarchy
            onViewTeamDetail={handleViewTeamDetail}
            onViewPlayers={handleViewPlayers}
            onUpgradeClick={onUpgradeClick}
          />
        );
      }
      return (
        <TeamDetail
          teamId={selectedTeamId}
          onBack={handleBackToHierarchy}
          onViewPlayers={handleViewPlayersFromDetail}
        />
      );
    
    case 'players':
      if (!selectedTeamId) {
        return (
          <TeamHierarchy
            onViewTeamDetail={handleViewTeamDetail}
            onViewPlayers={handleViewPlayers}
            onUpgradeClick={onUpgradeClick}
          />
        );
      }
      return (
        <Players
          teamId={selectedTeamId}
          categoryId={selectedCategoryId}
          categoryName={selectedCategoryName}
          onBack={handleBackToTeamDetail}
          onUpgradeClick={onUpgradeClick}
        />
      );
    
    default:
      return (
        <TeamHierarchy
          onViewTeamDetail={handleViewTeamDetail}
          onViewPlayers={handleViewPlayers}
          onUpgradeClick={onUpgradeClick}
        />
      );
  }
};

export default TeamsContainer;
