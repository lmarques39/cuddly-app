import { NavigatorScreenParams } from '@react-navigation/native';

export type RegistarStackParamList = {
  RegistarHub: undefined;
  Contrações: undefined;
  Amamentação: undefined;
  Biberão: undefined;
  Fraldas: undefined;
  MarcarConsulta: undefined;
};

export type PerfilStackParamList = {
  PerfilHub: undefined;
  PerfilDoBebe: undefined;
  ConsultasMedicas: undefined;
  Cuidadores: undefined;
  Notificacoes: undefined;
  PrivacidadeDados: undefined;
};

export type RootTabParamList = {
  Início: undefined;
  Registar: NavigatorScreenParams<RegistarStackParamList> | undefined;
  Histórico: undefined;
  Perfil: NavigatorScreenParams<PerfilStackParamList> | undefined;
};
