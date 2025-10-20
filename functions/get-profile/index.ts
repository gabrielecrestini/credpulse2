// functions/get-profile/index.ts
import { Request, Response } from '@nhost/functions';
import { gql, GraphQLClient, ClientError } from 'graphql-request';

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
  // --- GESTORE CORS COMPLETO ---
  res.setHeader('Access-Control-Allow-Origin', '*'); // In produzione metti il tuo dominio specifico!
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // Metodi usati
  // Header essenziali, inclusa Authorization per funzioni protette
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, x-nhost-webhook-secret'); 
  if (req.method === 'OPTIONS') {
    return res.status(204).send(''); // Risposta standard 204 No Content per OPTIONS
  }
  // ---------------------------

  const userId = req.nhost?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized', message: 'User ID not found in request context.' });
  }

  const adminSecret = process.env.NHOST_ADMIN_SECRET;
  const graphqlEndpoint = process.env.NHOST_GRAPHQL_URL;
  if (!graphqlEndpoint || !adminSecret) {
      return res.status(500).json({ error: 'Internal Server Error', message: 'Nhost configuration missing.' });
  }
  
  const client = new GraphQLClient(graphqlEndpoint, { headers: { 'x-hasura-admin-secret': adminSecret } });

  try {
    const data = await client.request(GET_PROFILE_QUERY, { userId: userId });
    if (!data.profiles_by_pk) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    return res.status(200).json(data.profiles_by_pk);
  } catch (error: any) {
    // Gestione errori come prima...
    console.error('Errore get-profile:', JSON.stringify(error, null, 2));
     if (error instanceof ClientError && error.response?.errors?.[0]?.extensions?.code === 'constraint-violation') {
        return res.status(404).json({ error: 'Profile constraint violation?' }); // Strano qui, ma per sicurezza
    }
    const errorMessage = error.message || 'Errore sconosciuto.';
    return res.status(500).json({ error: 'GraphQL Query Failed', details: errorMessage });
  }
};