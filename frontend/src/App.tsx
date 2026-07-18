import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './shared/components/layout/AppLayout';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { StudentsListPage } from './features/students/StudentsListPage';
import { OnboardingPage } from './features/onboarding/OnboardingPage';
import { StudentDetailPage } from './features/students/StudentDetailPage';
import { StudentEditPage } from './features/students/StudentEditPage';
import { EnrollmentsListPage } from './features/enrollments/EnrollmentsListPage';
import { NewEnrollmentPage } from './features/enrollments/NewEnrollmentPage';
import { EnrollmentDetailPage } from './features/enrollments/EnrollmentDetailPage';
import { PaymentsListPage } from './features/payments/PaymentsListPage';
import { NewPaymentPage } from './features/payments/NewPaymentPage';
import { PaymentDetailPage } from './features/payments/PaymentDetailPage';
import { AccountingPage } from './features/accounting/AccountingPage';
import { SettingsPage } from './features/payment-rules/SettingsPage';

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
          <Route index element={<DashboardPage />} />
          <Route path="etudiants" element={<StudentsListPage />} />
          <Route path="etudiants/nouveau" element={<OnboardingPage />} />
          <Route path="etudiants/:id" element={<StudentDetailPage />} />
          <Route path="etudiants/:id/modifier" element={<StudentEditPage />} />
          <Route path="inscriptions" element={<EnrollmentsListPage />} />
          <Route path="inscriptions/nouvelle" element={<NewEnrollmentPage />} />
          <Route path="inscriptions/:id" element={<EnrollmentDetailPage />} />
          <Route path="paiements" element={<PaymentsListPage />} />
          <Route path="paiements/nouveau" element={<NewPaymentPage />} />
          <Route path="paiements/:id" element={<PaymentDetailPage />} />
          <Route path="comptabilite" element={<AccountingPage />} />
          <Route path="parametres" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
