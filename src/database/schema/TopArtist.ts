export interface TopArtist {
  userId: string;
  username: string;
  Artists: Array<{
    name: string;
    count: number;
  }>;
}
