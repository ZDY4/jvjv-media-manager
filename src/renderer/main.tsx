import ReactDOM from 'react-dom/client';
import { FluentProvider } from '@fluentui/react-components';
import App from './App';
import './index.css';
import { appTheme } from './theme/fluentTheme';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <FluentProvider theme={appTheme}>
    <App />
  </FluentProvider>
);
