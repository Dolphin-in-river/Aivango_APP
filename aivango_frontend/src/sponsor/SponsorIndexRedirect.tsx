import { Navigate } from 'react-router-dom';
import { useSponsorDemo } from './SponsorDemoContext';

export default function SponsorIndexRedirect() {
  const { userRole } = useSponsorDemo();

  if (userRole === 'ORGANIZER') return <Navigate to="organizer/history" replace />;

  // Для обычного пользователя стартовая точка - список турниров.
  // Роль участия в турнире (зритель / спонсор / рыцарь) будет определяться на уровне турнира.
  return <Navigate to="tournaments" replace />;
}
