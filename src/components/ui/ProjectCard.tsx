import React from 'react';

export interface Project {
    id: string;
    name: string;
    status: string;
    // other fields can be added as needed
}

interface ProjectCardProps {
    project: Project;
}

/**
 * Simple ProjectCard component used in tests and UI.
 * Displays the project name and its status.
 */
const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
    return (
        <div className="p-4 border rounded-lg bg-white/5 border-white/10">
            <h3 className="text-lg font-bold text-white mb-2">{project.name}</h3>
            <span className="text-sm text-gray-400 capitalize">{project.status}</span>
        </div>
    );
};

export default ProjectCard;
