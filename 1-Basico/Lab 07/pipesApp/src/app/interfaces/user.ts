export interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
  active?: boolean;
  profile?: {
    description: string;
  };
  role: string;
}
