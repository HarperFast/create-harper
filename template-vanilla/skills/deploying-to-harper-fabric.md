# Deploying to Harper Fabric

To deploy your application to Harper Fabric, follow these steps:

1. **Sign up**: Create an account at [https://fabric.harper.fast](https://fabric.harper.fast) and create a cluster.

2. **Configure Environment**: Add your credentials and cluster URL to your `.env` file:
   ```bash
   # Deployments
   CLI_TARGET_USERNAME='YOUR_CLUSTER_USERNAME'
   CLI_TARGET_PASSWORD='YOUR_CLUSTER_PASSWORD'
   CLI_TARGET='YOUR_FABRIC.HARPER.FAST_CLUSTER_URL_HERE'
   ```

3. **Deploy Locally**: Run the following command to deploy from your local environment:
   ```bash
   npm run deploy
   ```

4. **Set up CI/CD**: Customize the included `.github/workflow/deploy.yaml` file and define your secrets in your GitHub repository's action settings to enable continuous deployment.
