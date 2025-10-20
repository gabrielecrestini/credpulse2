// functions/get-profile/index.ts
import { Request, Response } from '@nhost/functions';
import { gql, GraphQLClient } from 'graphql-request';

const GET_PROFILE_QUERY = gql`
  query GetUserProfile($userId: uuid!) {
    profiles_by_pk(id: $userId) {
      id
      referral_code
      creds_balance
      invite_count
    }
  }
`;

export default async (req: Request, res: Response) => {
  // CORS Handler
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).send('OK');

  // Verifica Autenticazione Utente
  const userId = req.nhost?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  // Client GraphQL (con Admin Secret)
  const adminSecret = process.env.NHOST_ADMIN_SECRET;
  const graphqlEndpoint = process.env.NHOST_GRAPHQL_URL;
  if (!graphqlEndpoint || !adminSecret) return res.status(500).json({ error: 'Configuration missing' });

  const client = new GraphQLClient(graphqlEndpoint, { headers: { 'x-hasura-admin-secret': adminSecret } });

  try {
    const data = await client.request(GET_PROFILE_QUERY, { userId: userId });
    if (!data.profiles_by_pk) return res.status(404).json({ error: 'Profile not found' });
    return res.status(200).json(data.profiles_by_pk);
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ error: 'Failed to fetch profile', details: error.message });
  }
};