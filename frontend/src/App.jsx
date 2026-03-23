import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import { APP_ROUTES } from './constants/routes';
import DashboardPage from './pages/DashboardPage';
import UploadStudyMaterialPage from './pages/UploadStudyMaterialPage';
import SubmitStudyMaterialPage from './pages/SubmitStudyMaterialPage';
import StudyMaterialListPage from './pages/StudyMaterialListPage';
import StructuredStudyMaterialsPage from './pages/StructuredStudyMaterialsPage';
import ManageStudyMaterialsPage from './pages/ManageStudyMaterialsPage';
import ManageModulesPage from './pages/ManageModulesPage';
import CreateKuppiSessionPage from './pages/CreateKuppiSessionPage';
import ManageKuppiSessionsPage from './pages/ManageKuppiSessionsPage';

const App = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path={APP_ROUTES.DASHBOARD} element={<DashboardPage />} />
        <Route path={APP_ROUTES.UPLOAD_STUDY_MATERIAL} element={<UploadStudyMaterialPage />} />
        <Route path={APP_ROUTES.SUBMIT_STUDY_MATERIAL} element={<SubmitStudyMaterialPage />} />
        <Route path={APP_ROUTES.STUDY_MATERIALS} element={<StudyMaterialListPage />} />
        <Route path={APP_ROUTES.STRUCTURED_STUDY_MATERIALS} element={<StructuredStudyMaterialsPage />} />
        <Route path={APP_ROUTES.MANAGE_STUDY_MATERIALS} element={<ManageStudyMaterialsPage />} />
        <Route path={APP_ROUTES.MANAGE_MODULES} element={<ManageModulesPage />} />
        <Route path={APP_ROUTES.CREATE_KUPPI_SESSION} element={<CreateKuppiSessionPage />} />
        <Route path={APP_ROUTES.MANAGE_KUPPI_SESSIONS} element={<ManageKuppiSessionsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={APP_ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
};

export default App;