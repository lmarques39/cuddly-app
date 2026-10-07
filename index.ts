import { registerRootComponent } from 'expo';

import App from './App';
// Defines the background task behind the running-timer notification's
// "Terminar" button (#101) — has to load before anything else renders.
import './src/features/activeSessions/sessionNotificationTask';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
