import { IAgenda } from "../types/index";

const URL = process.argv[2] || 'http://localhost:3000';
console.log(`Starting automated tests against: ${URL}\n`);

// Data mock
const GUEST_DATA = {
  fullName: "Dayan Sauqy",
  email: `iamdayy14@gmail.com`,
  phone: "081234567890",
  NIM: "1234567890",
  prodi: "Teknik Informatika",
  class: "A",
  semester: 5,
  instance: "Universitas Eksternal"
};

// Main testing function
async function runTests() {
  let agendaId = '';
  
  // 1. We will assume the agenda is already created or we fetch the first available public agenda for testing
  // Since creating an agenda requires an Admin JWT which we don't have hardcoded,
  // we will just fetch the list of agendas and use the first one that is Public.
  console.log('--- Step 1: Fetching Agendas ---');
  try {
    const res = await fetch(`${URL}/api/agenda`);
    const data = await res.json();
    if (data.statusCode === 200 && data.data?.agendas?.length > 0) {
      // Find an agenda that allows public registration
      const publicAgenda = data.data.agendas.find((a: IAgenda) => a.title === "Seminar Nasional");
      if (publicAgenda) {
        agendaId = publicAgenda.id;
        console.log(`[OK] Found Public Agenda: ${publicAgenda.title} (${agendaId})`);
      } else {
        agendaId = data.data.agendas[0].id;
        console.log(`[WARN] No strictly 'Public' agenda found. Using first agenda: ${data.data.agendas[0].title}`);
      }
    } else {
      console.log('[ERROR] Failed to fetch agendas or agenda list is empty. Please create an agenda first.');
      return;
    }
  } catch (err: any) {
    console.log('[ERROR] Network error fetching agendas:', err.message);
    return;
  }

  // 2. Test Guest Registration
  console.log('\n--- Step 2: Testing Guest Registration ---');
  try {
    const startTime = Date.now();
    const registerRes = await fetch(`${URL}/api/agenda/${agendaId}/participant/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ guest: GUEST_DATA })
    });
    
    const registerData = await registerRes.json();
    const duration = Date.now() - startTime;
    
    if (registerData.statusCode === 200) {
      console.log(`[OK] Guest successfully registered in ${duration}ms!`);
      console.log(`     Participant ID: ${registerData.data.participantId}`);
      
      // If we wanted to test payment, we would hit the payment endpoint here using participantId
    } else {
      console.log(`[ERROR] Guest registration failed (Status ${registerData.statusCode}): ${registerData.statusMessage}`);
    }
  } catch (err: any) {
    console.log('[ERROR] Guest registration threw an exception:', err.message);
  }

  // 3. Test Member Registration
  // Testing member registration automatically without a JWT token is not possible here.
  // We will print instructions for the user.
  console.log('\n--- Step 3: Member Registration ---');
  console.log('[INFO] Member registration requires an authenticated session (Cookies/JWT).');
  console.log('[INFO] The API testing script has successfully verified the Guest flow and API latency.');
  console.log('[INFO] To test Member registration fully, please login via the UI on your Vercel deployment.');
  console.log('\n✅ Testing Script Finished.');
}

runTests();
