import { ClusterController } from './controllers/cluster.controller.js';
import { CreatorController } from './controllers/creator.controller.js';
import { RiskController } from './controllers/risk.controller.js';

async function main(): Promise<void> {
  const riskController = new RiskController();
  const clusterController = new ClusterController();
  const creatorController = new CreatorController();

  console.log(JSON.stringify(riskController.getWalletRisk('DemoWallet'), null, 2));
  console.log(JSON.stringify(await clusterController.getCluster('demo-cluster'), null, 2));
  console.log(JSON.stringify(creatorController.getIntegrity('demo-creator'), null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  throw error;
});
