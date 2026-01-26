import fetch from "node-fetch";
import logger from "../logger/logger.js";

const HFI_API_URL = "https://api.hireflix.com/me";
const API_KEY = "0ae0f7df-d2fc-4bcf-9c13-148ed0e04fd4";

async function graphqlRequest(query) {
  try {
    const resp = await fetch(HFI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": API_KEY,
      },
      body: JSON.stringify({ query }),
    });

    const data = await resp.json();
    if (data.errors) {
      logger.error(`Hireflix GraphQL error: ${JSON.stringify(data.errors)}`);
      throw new Error(JSON.stringify(data.errors));
    }
    return data.data;
  } catch (error) {
    logger.error(`Hireflix request failed: ${error.message}`);
    throw error;
  }
}

async function inviteCandidate(positionId, firstName, lastName, email, phone) {
  logger.info(`Hireflix invite - Position: ${positionId}, Email: ${email}`);
  const mutation = `
    mutation {
      Position(id: "${positionId}") {
        invite(candidate: {
          name: "${firstName} ${lastName}",
          email: "${email}",
          phone: "${phone}"
        }) {
          id
          url {
            public
            private 
            short
          }
        }
      }
    }
  `;

  const result = await graphqlRequest(mutation);
  logger.info(`Hireflix invite created - Position: ${positionId}, Email: ${email}`);
  return result.Position.invite;
}


async function getPositions() {
  logger.info("Hireflix - Fetching positions");
  const query = `
    query {
      positions {
        id
        name
      }
    }
  `;

  const result = await graphqlRequest(query);
  logger.info("Hireflix - Positions fetched successfully");
  return result.positions;
  }

  async function getInterviewData(interviewId) {
  logger.info(`Hireflix - Fetch interview data - ID: ${interviewId}`);
  const query = `
  query GetInterview{
  interview(id: "${interviewId}") {
    id
    status
    questions {
      id
      title
      answer {
        url 
        transcription {
          languageCode
          text
        }
      }
    }
  }
} `;

  const result = await graphqlRequest(query);
  logger.info(`Hireflix - Interview data fetched - ID: ${interviewId}`);
  return result.interview;
}

async function updateInterviewFinalist(interviewId, finalist) {
  logger.info(`Hireflix - Update finalist - ID: ${interviewId}, finalist: ${finalist}`);
  const mutation = `
    mutation {
      Interview(id: "${interviewId}") {
        finalist(finalist: ${finalist}) {
          id
          status
          archived
          completed
          finalist
        }
      }
    } 
  `;

  const variables = { id: interviewId, finalist };
  const result = await graphqlRequest(mutation, variables);
  logger.info(`Hireflix - Finalist updated - ID: ${interviewId}`);
  return result.Interview.finalist;
}

async function updateInterviewDiscard(interviewId, archive) {
  logger.info(`Hireflix - Update archive status - ID: ${interviewId}, archive: ${archive}`);
  const mutation = `
    mutation {
      Interview(id: "${interviewId}") {
        archive(archive: ${archive}) {
          id
          status
          archived
          completed
          finalist
        }
      }
  } 
  `;

  const variables = { id: interviewId, archive };
  const result = await graphqlRequest(mutation, variables);
  logger.info(`Hireflix - Archive updated - ID: ${interviewId}`);
  return result.Interview.archive;
}

export { 
  inviteCandidate, 
  getPositions, 
  getInterviewData,
  updateInterviewFinalist,
  updateInterviewDiscard
 };
