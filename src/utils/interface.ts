import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';
export type CollectionReference = FirebaseFirestoreTypes.CollectionReference;
export type DocumentReference = FirebaseFirestoreTypes.DocumentReference;
export type DocumentData = FirebaseFirestoreTypes.DocumentData;
export type DocumentSnapshot = FirebaseFirestoreTypes.DocumentSnapshot;
export type Timestamp = FirebaseFirestoreTypes.Timestamp;

export interface Transfer {
  username: string;
  clubName: string;
  clubId: string;
  playerId: string;
  joined: boolean;
}

export interface Article {
  fields: {
    title: string;
    body: string;
    tags: string[];
    related: Article[];
    images?: {
      fields: {
        title: string;
        file: {
          url: string;
          details: {
            image: {
              width: number;
              height: number;
            };
          };
          fileName: string;
        };
      };
      sys: {
        id: string;
      };
    }[];
  };
  metadata: {};
  sys: {
    id: string;
  };
}

export interface MatchPlayerData {
  submitted: boolean;
  clubId: string;
  username: string;
  motm: boolean;
  club: string;
  goals?: number;
  rating?: number;
}

export interface PlayerStatsInfo {
  id: string;
  username: string;
  motm?: string | number;
  club: string;
  clubId: string;
  matches?: number;
}

export interface GoalkeeperStats {
  rating: any;
  shotsAgainst: any;
  shotsOnTarget: any;
  saves: any;
  goalsConceded: any;
  saveSuccessRate: any;
  shootoutSaves: any;
  shootoutGoalsConceded: any;
}

export interface OutfieldPlayerStats {
  rating: any;
  goals: any;
  assists: any;
  shots: any;
  shotsAccuracy: any;
  passes: any;
  passAccuracy: any;
  dribbles: any;
  dribblesSuccessRate: any;
  tackles: any;
  tackleSuccessRate: any;
  offsides: any;
  fouls: any;
  possessionWon: any;
  possessionLost: any;
  minutesPlayed: any;
  distanceCovered: any;
  distanceSprinted: any;
}

export interface FixtureList extends IFlatList {
  data: IMatchNavData;
}

export interface ILeagueProps {
  isAdmin: boolean;
  newLeague: boolean;
  scheduled?: boolean;
  acceptClub?: boolean;
}

export interface IMatchNavData extends IMatch {
  matchId: string;
  leagueName: string;
  homeTeamName: string;
  clubId: string;
  leagueId: string;
  manager: boolean;
  awayTeamName: string;
  admin: boolean;
}

export interface IMatch {
  awayTeamId: string;
  homeTeamId: string;
  id: number;
  submissions?: {
    [team: string]: {
      [team: string]: number;
    };
  };
  motmSubmissions?: {
    [team: string]: string;
  };
  motm?: string;
  teams?: [string, string];
  published: boolean;
  conflict: boolean;
  motmConflict: boolean;
  result?: {[team: string]: number};
  players?: {[id: string]: MatchPlayerData};
  notSubmittedPlayers?: string[];
  submissionCount: number;
}

export interface ISectionList {
  title: string;
  data: {}[];
}

export interface IFlatList {
  id: string;
  data: {};
}

export interface IMyRequests extends ISectionList {
  data: ISentRequest[];
}

export interface ISentRequest {
  clubId: string;
  clubName: string;
  accepted: boolean;
  leagueId: string;
  leagueName: string;
  playerId?: string;
  manager: boolean;
}

export interface IClubRequest extends ISectionList {
  data: IPlayerRequestData[];
}

export interface ILeagueRequest extends ISectionList {
  data: IClubRequestData[];
}

export interface IPlayerRequestData extends IClubRosterMember {
  leagueId: string;
  playerId: string;
  clubId: string;
}

export interface IClubRequestData extends IClub {
  clubId: string;
}

export interface ILeague {
  name: string;
  description?: string;
  discord?: string;
  twitter?: string;
  platform: 'ps' | 'xb';
  teamNum: number;
  acceptedClubs: number;
  matchNum: number;
  private: boolean;
  scheduled: boolean;
  created: Timestamp;
  admins: ILeagueAdmin;
  clubs?: {
    [club: string]: IClub;
  };
  conflictMatchesCount: 0;
  ownerId: string;
  clubIndex: {[clubId: string]: string};
}

export interface ILeagueAdmin {
  [uid: string]: {
    owner: boolean;
    username: string;
  };
}

export interface IClubRosterMember {
  accepted: boolean;
  username: string;
}
export interface IClub {
  name: string;
  managerId: string;
  accepted: boolean;
  managerUsername: string;
  roster: {
    [uid: string]: IClubRosterMember;
  };
  created: Timestamp;
  leagueId: string;
}

export interface IUserLeague {
  clubId?: string;
  manager?: boolean;
  admin?: boolean;
  accepted?: boolean;
  clubName?: string;
  owner?: boolean;
}

export interface IUser {
  username: string;
  premium: boolean;
  adminConflictCounts?: number;
  leagues?: {
    [league: string]: IUserLeague;
  };
}

export interface IClubStanding {
  name: string;
  played: number;
  won: number;
  lost: number;
  draw: number;
  points: number;
  scored: number;
  conceded: number;
}

export interface UserInfo {
  email: string;
  password: string;
  username: string;
}
