import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  title: string;
  message: string;
  buttons?: AlertButton[];
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlert must be used within AlertProvider');
  return context;
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alert, setAlert] = useState<AlertOptions | null>(null);

  const showAlert = (options: AlertOptions) => setAlert(options);
  const handleClose = (button?: AlertButton) => {
    setAlert(null);
    button?.onPress?.();
  };

  // Expose context globally for utility
  if (typeof window !== 'undefined') {
    (window as any).__alertContext = { showAlert };
  }

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alert && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: 24,
              borderRadius: 8,
              minWidth: 300,
            }}
          >
            <h3>{alert.title}</h3>
            <p>{alert.message}</p>
            <div
              style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}
            >
              {(alert.buttons || [{ text: 'OK' }]).map((btn, i) => (
                <button
                  key={i}
                  onClick={() => handleClose(btn)}
                  style={{
                    padding: '6px 16px',
                    background:
                      btn.style === 'destructive' ? '#e57373' : '#1976d2',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  {btn.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};
