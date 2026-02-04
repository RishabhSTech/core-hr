import { Profile } from '@/types/hrms';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface OrgChartNodeProps {
  profile: Profile;
  role: string;
  children?: Profile[];
  roles: Record<string, string>;
  isClickable?: boolean;
}

export function OrgChartNode({ profile, role, children = [], roles, isClickable = false }: OrgChartNodeProps) {
  const navigate = useNavigate();

  const getInitials = () => {
    return `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();
  };

  const getRoleColor = () => {
    switch (role) {
      case 'owner': return 'border-purple-200 bg-purple-50';
      case 'admin': return 'border-blue-200 bg-blue-50';
      case 'manager': return 'border-green-200 bg-green-50';
      default: return 'border-border bg-card';
    }
  };

  const handleClick = () => {
    if (isClickable) {
      navigate(`/employees/${profile.id}`);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <Card 
        className={`p-4 transition-shadow ${getRoleColor()} ${isClickable ? 'cursor-pointer hover:shadow-md' : ''}`}
        onClick={handleClick}
      >
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-12 w-12 mb-2">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <p className="font-medium text-foreground text-sm">
            {profile.first_name} {profile.last_name}
          </p>
          <p className="text-xs text-muted-foreground capitalize">{role}</p>
          {profile.department?.name && (
            <p className="text-xs text-muted-foreground mt-1">{profile.department.name}</p>
          )}
        </div>
      </Card>
      
      {children.length > 0 && (
        <>
          <div className="w-px h-8 bg-border" />
          <div className="flex gap-6">
            {children.map((child) => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="w-px h-4 bg-border" />
                <OrgChartNode 
                  profile={child} 
                  role={roles[child.user_id] || 'employee'} 
                  roles={roles}
                  isClickable={isClickable}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}