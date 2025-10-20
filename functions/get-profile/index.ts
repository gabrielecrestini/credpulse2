// functions/get-profile/index.ts
import { Request, Response } from '@nhost/functions';
import { gql, GraphQLClient, ClientError } from 'graphql-request';

// Query GraphQL completa per il profilo
const GET_PROFILE_QUERY = gql`
  query GetUserProfile($userId: uuid!) {
    profiles_by_pk(id: $userId) {
      id
      referral_code
      creds_balance  // <-- Già presente
      invite_count   // <-- Già presente
      username       // <-- Aggiunto se vuoi mostrarlo
    }
  }
`;

export default async (req: Request, res: Response) => {
  // --- GESTORE CORS COMPLETO ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, x-nhost-webhook-secret');
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }
  // ---------------------------

  const userId = req.nhost?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const adminSecret = process.env.NHOST_ADMIN_SECRET;
  const graphqlEndpoint = process.env.NHOST_GRAPHQL_URL;
  if (!graphqlEndpoint || !adminSecret) {
      return res.status(500).json({ error: 'Configuration missing' });
  }

  const client = new GraphQLClient(graphqlEndpoint, { headers: { 'x-hasura-admin-secret': adminSecret } });

  try {
    const data = await client.request(GET_PROFILE_QUERY, { userId: userId });
    if (!data.profiles_by_pk) {
      // Se il profilo non esiste (raro dopo il login), restituisci dati di default
      return res.status(404).json({
          id: userId,
          referral_code: null,
          creds_balance: 0,
          invite_count: 0,
          username: null
       });
    }
    // Restituisce tutti i dati del profilo
    return res.status(200).json(data.profiles_by_pk);
  } catch (error: any) {
    console.error('Errore get-profile:', JSON.stringify(error, null, 2));
    const errorMessage = error.message || 'Errore sconosciuto.';
    return res.status(500).json({ error: 'GraphQL Query Failed', details: errorMessage });
  }
};