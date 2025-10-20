// functions/create-profile/index.ts
import { Request, Response } from '@nhost/functions';
import { gql, GraphQLClient } from 'graphql-request';

const generateReferralCode = () => 'CP-' + Math.random().toString(36).substring(2, 8).toUpperCase();

const INSERT_PROFILE_MUTATION = gql`
  mutation InsertProfileOnSignup($id: uuid!, $referral_code: String!) {
    insert_profiles_one(object: {id: $id, referral_code: $referral_code}) {
      id
    }
  }
`;

export default async (req: Request, res: Response) => {
  // CORS Handler
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, x-nhost-webhook-secret');
  if (req.method === 'OPTIONS') return res.status(200).send('OK');

  // Sicurezza Webhook
  const adminSecret = process.env.NHOST_ADMIN_SECRET;
  const requestSecret = req.headers['x-nhost-webhook-secret'];
  if (!adminSecret || requestSecret !== adminSecret) return res.status(401).send('Unauthorized');

  const userId = req.body.event?.data?.new?.id;
  if (!userId || typeof userId !== 'string') return res.status(400).send('Bad Request: Missing user ID');

  const referralCode = generateReferralCode();
  const graphqlEndpoint = process.env.NHOST_GRAPHQL_URL;
  if (!graphqlEndpoint) return res.status(500).send('Internal Server Error: GraphQL URL missing');

  const client = new GraphQLClient(graphqlEndpoint, { headers: { 'x-hasura-admin-secret': adminSecret } });

  try {
    await client.request(INSERT_PROFILE_MUTATION, { id: userId, referral_code: referralCode });
    return res.status(200).json({ message: 'Profile created' });
  } catch (error: any) {
    if (error.response?.errors?.[0]?.extensions?.code === 'constraint-violation') {
      return res.status(200).json({ message: 'Profile already exists' });
    }
    console.error('Error inserting profile:', error);
    return res.status(500).json({ error: 'Failed to create profile', details: error.message });
  }
};