"use client";

import React, { useState, useEffect } from "react";
import { TeamMember, AppConfig } from "@/lib/types";
import TeamMemberForm from "./TeamMemberForm";
import TeamMemberList from "./TeamMemberList";
import EmptyState from "./ui/EmptyState";
import ConfirmDialog from "./ui/ConfirmDialog";

interface TeamManagementProps {
  config: AppConfig;
  onConfigUpdate: (config: AppConfig) => void;
}

export default function TeamManagement({
  config,
  onConfigUpdate,
}: TeamManagementProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<{
    member: TeamMember;
    index: number;
  } | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(
    config.teamMembers
  );
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(
    null
  );

  // Update local state when config changes
  useEffect(() => {
    setTeamMembers(config.teamMembers);
  }, [config.teamMembers]);

  const handleAddMember = () => {
    setEditingMember(null);
    setShowForm(true);
  };

  const handleEditMember = (member: TeamMember, index: number) => {
    setEditingMember({ member, index });
    setShowForm(true);
  };

  const handleSaveMember = (member: TeamMember) => {
    let updatedMembers: TeamMember[];

    if (editingMember !== null) {
      // Editing existing member
      updatedMembers = [...teamMembers];
      updatedMembers[editingMember.index] = member;
    } else {
      // Adding new member
      updatedMembers = [...teamMembers, member];
    }

    setTeamMembers(updatedMembers);

    // Update the config
    const updatedConfig: AppConfig = {
      ...config,
      teamMembers: updatedMembers,
    };

    onConfigUpdate(updatedConfig);

    // Close form
    setShowForm(false);
    setEditingMember(null);
  };

  const handleDeleteClick = (index: number) => {
    setDeleteConfirmIndex(index);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmIndex !== null) {
      const updatedMembers = teamMembers.filter(
        (_, i) => i !== deleteConfirmIndex
      );
      setTeamMembers(updatedMembers);

      // Update the config
      const updatedConfig: AppConfig = {
        ...config,
        teamMembers: updatedMembers,
      };

      onConfigUpdate(updatedConfig);
      setDeleteConfirmIndex(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmIndex(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingMember(null);
  };

  return (
    <div className="space-y-6">
      {showForm ? (
        <TeamMemberForm
          teamMember={editingMember?.member}
          onSave={handleSaveMember}
          onCancel={handleCancelForm}
          defaultMeetingPercentage={config.defaultMeetingPercentage}
        />
      ) : (
        <>
          {teamMembers.length === 0 ? (
            <EmptyState
              icon="👥"
              title="No Team Members"
              description="Add team members to start tracking sprint capacity and calculating working hours for your sprints."
              actionText="Add First Team Member"
              onAction={handleAddMember}
            />
          ) : (
            <TeamMemberList
              teamMembers={teamMembers}
              onEdit={handleEditMember}
              onDelete={handleDeleteClick}
              onAdd={handleAddMember}
            />
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmIndex !== null}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${
          deleteConfirmIndex !== null
            ? teamMembers[deleteConfirmIndex]?.name
            : ""
        } from the team? This will affect capacity calculations for future sprints.`}
        confirmText="Remove Member"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        variant="warning"
      />
    </div>
  );
}
