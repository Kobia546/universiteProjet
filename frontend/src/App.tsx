import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './shared/components/layout/AppLayout';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { ModuleRoute } from './features/auth/ModuleRoute';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { StudentsListPage } from './features/students/StudentsListPage';
import { OnboardingPage } from './features/onboarding/OnboardingPage';
import { StudentDetailPage } from './features/students/StudentDetailPage';
import { StudentEditPage } from './features/students/StudentEditPage';
import { EnrollmentsListPage } from './features/enrollments/EnrollmentsListPage';
import { EnrollmentDetailPage } from './features/enrollments/EnrollmentDetailPage';
import { PaymentsListPage } from './features/payments/PaymentsListPage';
import { NewPaymentPage } from './features/payments/NewPaymentPage';
import { PaymentDetailPage } from './features/payments/PaymentDetailPage';
import { AccountingPage } from './features/accounting/AccountingPage';
import { ConsultationsPage } from './features/consultations/ConsultationsPage';
import { EditionsPage } from './features/editions/EditionsPage';
import { SettingsPage } from './features/payment-rules/SettingsPage';
import { AidePage } from './features/aide/AidePage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/connexion" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <ModuleRoute module="TABLEAU_DE_BORD">
                <DashboardPage />
              </ModuleRoute>
            }
          />
          <Route
            path="etudiants"
            element={
              <ModuleRoute module="ETUDIANTS">
                <StudentsListPage />
              </ModuleRoute>
            }
          />
          <Route
            path="etudiants/:id"
            element={
              <ModuleRoute module="ETUDIANTS">
                <StudentDetailPage />
              </ModuleRoute>
            }
          />
          <Route
            path="etudiants/:id/modifier"
            element={
              <ModuleRoute module="ETUDIANTS">
                <StudentEditPage />
              </ModuleRoute>
            }
          />
          <Route
            path="inscriptions"
            element={
              <ModuleRoute module="INSCRIPTIONS">
                <EnrollmentsListPage />
              </ModuleRoute>
            }
          />
          <Route
            path="inscriptions/nouvelle"
            element={
              <ModuleRoute module="INSCRIPTIONS">
                <OnboardingPage />
              </ModuleRoute>
            }
          />
          <Route
            path="inscriptions/:id"
            element={
              <ModuleRoute module="INSCRIPTIONS">
                <EnrollmentDetailPage />
              </ModuleRoute>
            }
          />
          <Route
            path="paiements"
            element={
              <ModuleRoute module="PAIEMENTS">
                <PaymentsListPage />
              </ModuleRoute>
            }
          />
          <Route
            path="paiements/nouveau"
            element={
              <ModuleRoute module="PAIEMENTS">
                <NewPaymentPage />
              </ModuleRoute>
            }
          />
          <Route
            path="paiements/:id"
            element={
              <ModuleRoute module="PAIEMENTS">
                <PaymentDetailPage />
              </ModuleRoute>
            }
          />
          <Route
            path="comptabilite"
            element={
              <ModuleRoute module="COMPTABILITE">
                <AccountingPage />
              </ModuleRoute>
            }
          />
          <Route
            path="consultations"
            element={
              <ModuleRoute module="CONSULTATIONS">
                <ConsultationsPage />
              </ModuleRoute>
            }
          />
          <Route
            path="editions"
            element={
              <ModuleRoute module="EDITIONS">
                <EditionsPage />
              </ModuleRoute>
            }
          />
          <Route
            path="parametres"
            element={
              <ModuleRoute module="ADMINISTRATION">
                <SettingsPage />
              </ModuleRoute>
            }
          />
          <Route
            path="aide"
            element={
              <ModuleRoute module="AIDE">
                <AidePage />
              </ModuleRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
