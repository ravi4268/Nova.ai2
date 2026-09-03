import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

test('renders the login screen', () => {
  render(<App />);
  expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
});

test('shows forgot password otp flow', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /forgot password\?/i }));

  const emailInput = screen.getByPlaceholderText(/enter your email/i);
  fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

  fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

  expect(screen.getByText(/otp sent to your email/i)).toBeInTheDocument();
  expect(screen.getByText(/verify otp/i)).toBeInTheDocument();
});
