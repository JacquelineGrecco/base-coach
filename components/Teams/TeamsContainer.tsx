import React, { useState } from 'react';
import Teams from './Teams';
import TeamDetail from './TeamDetail';
import Players from './Players';

type TeamView = 'list' | 'detail' | 'players';

const TeamsContainer: React.FC = () => {
  const [currentView, setCurrentView] = useState<TeamView>('list');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');

  function handleViewTeamDetail(teamId: string) {
    setSelectedTeamId(teamId);
    setCurrentView('detail');
  }

  function handleViewPlayers(categoryId: string | null, categoryName: string) {
    setSelectedCategoryId(categoryId);
    setSelectedCategoryName(categoryName);
    setCurrentView('players');
  }

  function handleBackToList() {
    setCurrentView('list');
    setSelectedTeamId(null);
    setSelectedCategoryId(null);
  }

  function handleBackToTeamDetail() {
    setCurrentView('detail');
    setSelectedCategoryId(null);
  }

  switch (currentView) {
    case 'list':
      return <Teams onViewTeamDetail={handleViewTeamDetail} />;
    
    case 'detail':
      if (!selectedTeamId) {
        return <Teams onViewTeamDetail={handleViewTeamDetail} />;
      }
      return (
        <TeamDetail
          teamId={selectedTeamId}
          onBack={handleBackToList}
          onViewPlayers={handleViewPlayers}
        />
      );
    
    case 'players':
      if (!selectedTeamId) {
        return <Teams onViewTeamDetail={handleViewTeamDetail} />;
      }
      return (
        <Players
          teamId={selectedTeamId}
          categoryId={selectedCategoryId}
          categoryName={selectedCategoryName}
          onBack={handleBackToTeamDetail}
        />
      );
    
    default:
      return <Teams onViewTeamDetail={handleViewTeamDetail} />;
  }
};

export default TeamsContainer;


