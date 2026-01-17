import fetch from "node-fetch";
const HFI_API_URL = "https://api.hireflix.com/me";
const API_KEY = "0ae0f7df-d2fc-4bcf-9c13-148ed0e04fd4";

async function graphqlRequest(query) {
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
    console.error("GraphQL Error:", data.errors);
    throw new Error(JSON.stringify(data.errors));
  }
  return data.data;
}

async function inviteCandidate(positionId, firstName, lastName, email, phone) {
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
  return result.Position.invite;
}


async function getPositions() {
  const query = `
    query {
      positions {
        id
        name
      }
    }
  `;

  const result = await graphqlRequest(query);
  return result.positions;
  }

  async function getInterviewData(interviewId) {
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
  return result.interview;
}

async function updateInterviewFinalist(interviewId, finalist) {
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
  return result.Interview.finalist;
}

async function updateInterviewDiscard(interviewId, archive) {
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
  return result.Interview.archive;
}

export { 
  inviteCandidate, 
  getPositions, 
  getInterviewData,
  updateInterviewFinalist,
  updateInterviewDiscard
 };
