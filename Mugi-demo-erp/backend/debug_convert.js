
const { prisma } = require('./lib/prisma');

async function checkLead() {
  try {
    const lead = await prisma.lead.findFirst({
      where: { name: { contains: 'Jim Halpert', mode: 'insensitive' } }
    });
    console.log('Lead Found:', lead);

    if (lead) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          OR: [
            { email: lead.email || '' },
            { phone: lead.phone || '' }
          ]
        }
      });
      console.log('Existing Customer with same Email/Phone:', existingCustomer);

      const existingOpportunity = await prisma.opportunity.findUnique({
        where: { leadId: lead.id }
      });
      console.log('Existing Opportunity for this Lead:', existingOpportunity);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkLead();
