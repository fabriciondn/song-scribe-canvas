import React, { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { QueryProvider } from '@/context/QueryContext';
import { ImpersonationProvider } from '@/context/ImpersonationContext';
import { PageFunctionStatusWrapper } from '@/components/layout/FunctionStatusWrapper';
import { NextUIProvider } from '@nextui-org/react';

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <NextUIProvider>
      <QueryProvider>
        <BrowserRouter>
          <AuthProvider>
            <ImpersonationProvider>
              <PageFunctionStatusWrapper>
                <App />
              </PageFunctionStatusWrapper>
            </ImpersonationProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryProvider>
    </NextUIProvider>
  </StrictMode>
);
