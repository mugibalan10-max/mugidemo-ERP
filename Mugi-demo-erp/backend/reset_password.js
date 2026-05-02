const { prisma } = require('./lib/prisma');
const bcrypt = require('bcrypt');

async function main() {
  const email = 'admin@mugi.com';
  const newPassword = 'admin123';
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword }
  });
  
  console.log(`✅ Password for ${email} has been reset to: ${newPassword}`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
