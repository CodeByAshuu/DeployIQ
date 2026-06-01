import { prisma } from './src/config/db.js';
import { createDeployment, runDeploymentPipeline } from './src/services/deployment.service.js';

async function verify() {
  console.log('=== STARTING DEPLOYIQ END-TO-END DEPLOYMENT ENGINE VERIFICATION ===\n');

  // 1. Get or create test user
  let user = await prisma.user.findUnique({ where: { email: 'test@deployiq.com' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@deployiq.com',
        password: 'hashed_password_placeholder',
      }
    });
    console.log(`Created test user: ${user.email}`);
  } else {
    console.log(`Using existing test user: ${user.email}`);
  }

  // 2. Clean up previous test projects and their containers/images
  const testProjectNames = ['Static Test', 'Node.js Test', 'Compose Test'];
  const projects = await prisma.project.findMany({
    where: { ownerId: user.id, name: { in: testProjectNames } }
  });

  console.log(`Cleaning up ${projects.length} existing test projects...`);
  const { deleteDeployment } = await import('./src/services/deployment.service.js');
  for (const p of projects) {
    const deployments = await prisma.deployment.findMany({ where: { projectId: p.id } });
    for (const d of deployments) {
      console.log(`Cleaning up container and files for deployment: ${d.id}`);
      try {
        await deleteDeployment(d.id, user.id);
      } catch (e) {
        console.error(`Cleanup failed for deployment ${d.id}: ${e.message}`);
      }
    }
    try {
      await prisma.project.delete({ where: { id: p.id } });
    } catch (e) {
      console.error(`Cleanup failed for project ${p.id}: ${e.message}`);
    }
  }

  // Define test cases
  const testCases = [
    {
      name: 'Static Test',
      repo: '/app/test-repos/static',
      description: 'Static HTML website deployment'
    },
    {
      name: 'Node.js Test',
      repo: '/app/test-repos/nodejs',
      description: 'Node.js Express backend deployment with Dockerfile auto-generation'
    },
    {
      name: 'Compose Test',
      repo: '/app/test-repos/compose',
      description: 'Multi-service deployment using Docker Compose'
    }
  ];

  const results = [];

  for (const tc of testCases) {
    console.log(`\n------------------------------------------------------------`);
    console.log(`🚀 RUNNING TEST CASE: ${tc.name} (${tc.description})`);
    console.log(`------------------------------------------------------------`);

    try {
      // Create project
      const project = await prisma.project.create({
        data: {
          name: tc.name,
          description: tc.description,
          githubRepo: tc.repo,
          ownerId: user.id,
          deploymentStatus: 'PENDING'
        }
      });
      console.log(`Created Project in DB: ${project.id}`);

      // Create deployment
      const deployment = await createDeployment(project.id, 'latest', user.id);
      console.log(`Created Deployment in DB: ${deployment.id}`);

      // Run pipeline
      console.log(`Running deployment pipeline...`);
      await runDeploymentPipeline(deployment.id);

      // Verify DB deployment state
      const updated = await prisma.deployment.findUnique({
        where: { id: deployment.id }
      });

      console.log(`Deployment final status: ${updated.status}`);
      console.log(`Allocated Port: ${updated.assignedPort}`);
      console.log(`Runtime Status: ${updated.runtimeStatus}`);
      console.log(`Deployment URL: ${updated.deploymentUrl}`);
      console.log(`Container/Project ID: ${updated.containerId}`);

      if (updated.status !== 'SUCCESS') {
        throw new Error(`Deployment failed. Logs:\n${updated.logs}`);
      }

      // Check HTTP connectivity and response content
      if (updated.assignedPort) {
        console.log(`Testing HTTP connectivity at http://host.docker.internal:${updated.assignedPort}...`);
        // Wait 2 seconds for server to fully initialize
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const response = await fetch(`http://host.docker.internal:${updated.assignedPort}`);
        const text = await response.text();
        console.log(`HTTP Status: ${response.status}`);
        console.log(`HTTP Response snippet: "${text.substring(0, 100).trim()}"`);
        
        if (response.ok) {
          console.log(`✅ HTTP verification PASSED!`);
          results.push({ name: tc.name, success: true, details: `Status: ${updated.status}, Port: ${updated.assignedPort}, HTTP OK` });
        } else {
          throw new Error(`HTTP verification failed with status: ${response.status}`);
        }
      } else {
        console.log(`⚠️ Warning: No port assigned, skipping HTTP connectivity test.`);
        results.push({ name: tc.name, success: true, details: `Status: ${updated.status}, No Port, Container running` });
      }

    } catch (err) {
      console.error(`❌ TEST CASE FAILED (${tc.name}):`, err.message);
      results.push({ name: tc.name, success: false, details: err.message });
    }
  }

  console.log(`\n============================================================`);
  console.log(`📊 E2E VERIFICATION RESULTS SUMMARY`);
  console.log(`============================================================`);
  let allPass = true;
  for (const r of results) {
    const icon = r.success ? '✅' : '❌';
    console.log(`${icon} ${r.name}: ${r.details}`);
    if (!r.success) allPass = false;
  }

  if (allPass) {
    console.log(`\n🎉 ALL END-TO-END DEPLOYMENTS SUCCESSFULLY VERIFIED!`);
    process.exit(0);
  } else {
    console.log(`\n❌ SOME TEST CASES FAILED. Please review the logs above.`);
    process.exit(1);
  }
}

verify().catch(err => {
  console.error('Verification script crashed:', err);
  process.exit(1);
});
