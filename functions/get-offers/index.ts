// functions/get-offers/index.ts
import { Request, Response } from '@nhost/functions';
import { gql, GraphQLClient } from 'graphql-request';

const GET_ACTIVE_OFFERS_QUERY = gql`
  query GetActiveOffers {
    offers(where: {is_active: {_eq: true}}) {
      id
      title
      description
      reward_creds
      affiliate_link
      provider_name
      category
    }
  }
`;

export default async (req: Request, res: Response) => {
  // --- GESTORE CORS COMPLETO ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS'); // Solo GET e OPTIONS per questa funzione pubblica
  // L'header Authorization NON serve qui se è pubblica, ma includerlo non fa male e risolve l'errore specifico
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type'); 
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }
  // ---------------------------

  const adminSecret = process.env.NHOST_ADMIN_SECRET;
  const graphqlEndpoint = process.env.NHOST_GRAPHQL_URL;
  if (!graphqlEndpoint || !adminSecret) {
      return res.status(500).json({ error: 'Internal Server Error', message: 'Configuration missing' });
  }

  const client = new GraphQLClient(graphqlEndpoint, { headers: { 'x-hasura-admin-secret': adminSecret } });

  try {
    const data = await client.request(GET_ACTIVE_OFFERS_QUERY);
    return res.status(200).json(data.offers);
  } catch (error: any) {
    console.error('Errore get-offers:', error);
    return res.status(500).json({ error: 'Failed to fetch offers', details: error.message });
  }
};