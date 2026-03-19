targetScope = 'resourceGroup'

@description('The environment name')
param environmentName string

@description('The location for all resources')
param location string = resourceGroup().location

@description('The backend container image to deploy')
param backendContainerImage string = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'

@description('The frontend container image to deploy')
param frontendContainerImage string = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'

@description('The project name for resource naming')
param projectName string = 'shadcn-fastapi'

@description('Azure OpenAI deployment name')
param azureOpenAIDeploymentName string = 'gpt-4o'

@description('Azure OpenAI API version')
param azureOpenAIApiVersion string = '2025-04-01-preview'

@description('Azure OpenAI embedding model')
param azureOpenAIEmbeddingModel string = 'text-embedding-3-large'

@description('PostgreSQL administrator login')
param postgresAdminLogin string

@description('PostgreSQL administrator password')
@secure()
param postgresAdminPassword string

@description('PostgreSQL application database name')
param postgresDbName string = 'claims_app'

@description('Custom domain for the frontend (e.g. claims.go-agentic.com). Leave empty to skip.')
param frontendCustomDomain string = ''

// Generate a short unique suffix for resource naming
var uniqueSuffix = take(uniqueString(resourceGroup().id), 6)

// Common tags for all resources
var commonTags = {
  Environment: environmentName
  Project: projectName
  Location: location
  ManagedBy: 'Bicep'
}

// Simple, short resource names that stay within limits
var containerAppsEnvironmentName = 'env-${uniqueSuffix}'
var containerRegistryName = 'cr${uniqueSuffix}'
var cognitiveServicesAccountName = 'oai-${uniqueSuffix}'
var managedIdentityName = 'id-${uniqueSuffix}'
var backendContainerAppName = 'backend-${uniqueSuffix}'
var frontendContainerAppName = 'frontend-${uniqueSuffix}'
var postgresServerName = 'pg-${uniqueSuffix}'

// Create managed identity for container registry access
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: managedIdentityName
  location: location
  tags: commonTags
}

module network 'modules/network.bicep' = {
  name: 'network'
  params: {
    location: location
    tags: commonTags
    resourceSuffix: uniqueSuffix
  }
}

// Deploy container apps stack (environment + registry)
module containerAppsStack 'modules/container-apps-stack.bicep' = {
  name: 'container-apps-stack'
  params: {
    containerAppsEnvironmentName: containerAppsEnvironmentName
    containerRegistryName: containerRegistryName
    location: location
    tags: commonTags
    environmentName: environmentName
    infrastructureSubnetId: network.outputs.containerAppsInfrastructureSubnetId
  }
}

module postgresFlexibleServer 'modules/postgres-flexible-server.bicep' = {
  name: 'postgres-flexible-server'
  params: {
    serverName: postgresServerName
    databaseName: postgresDbName
    location: location
    tags: commonTags
    administratorLogin: postgresAdminLogin
    administratorPassword: postgresAdminPassword
    delegatedSubnetId: network.outputs.postgresDelegatedSubnetId
    privateDnsZoneId: network.outputs.privateDnsZoneId
  }
}

// Assign AcrPull role to managed identity
module roleAssignment 'modules/role-assignment.bicep' = {
  name: 'role-assignment'
  params: {
    registryId: containerAppsStack.outputs.containerRegistryId
    managedIdentityPrincipalId: managedIdentity.properties.principalId
  }
}

// Deploy Azure OpenAI (Cognitive Services)
module cognitiveServices 'modules/cognitive-services.bicep' = {
  name: 'cognitive-services'
  params: {
    accountName: cognitiveServicesAccountName
    location: location
    tags: commonTags
    chatModelName: azureOpenAIDeploymentName
    embeddingModelName: azureOpenAIEmbeddingModel
    principalId: managedIdentity.properties.principalId
  }
}

// Deploy backend container app
module backendContainerApp 'modules/containerapp.bicep' = {
  name: 'backend-container-app'
  params: {
    name: backendContainerAppName
    location: location
    environmentId: containerAppsStack.outputs.containerAppsEnvironmentId
    containerImage: backendContainerImage
    containerPort: 8000
    registryServer: containerAppsStack.outputs.containerRegistryLoginServer
    managedIdentityResourceId: managedIdentity.id
    tags: commonTags
    environmentVariables: [
      {
        name: 'ENVIRONMENT'
        value: 'production'
      }
      {
        name: 'FRONTEND_ORIGIN'
        value: 'https://${frontendContainerAppName}.${containerAppsStack.outputs.containerAppsEnvironmentDefaultDomain}'
      }
      {
        name: 'FRONTEND_CUSTOM_ORIGIN'
        value: frontendCustomDomain != '' ? 'https://${frontendCustomDomain}' : ''
      }
      {
        name: 'AZURE_OPENAI_ENDPOINT'
        value: cognitiveServices.outputs.endpoint
      }
      {
        name: 'AZURE_OPENAI_DEPLOYMENT_NAME'
        value: azureOpenAIDeploymentName
      }
      {
        name: 'AZURE_OPENAI_API_VERSION'
        value: azureOpenAIApiVersion
      }
      {
        name: 'AZURE_OPENAI_EMBEDDING_MODEL'
        value: azureOpenAIEmbeddingModel
      }
      {
        name: 'AZURE_CLIENT_ID'
        value: managedIdentity.properties.clientId
      }
      {
        name: 'DATABASE_URL'
        secretRef: 'database-url'
      }
    ]
    secrets: [
      {
        name: 'database-url'
        value: 'postgresql+asyncpg://${postgresAdminLogin}:${postgresAdminPassword}@${network.outputs.privateDnsZoneName}:5432/${postgresDbName}?ssl=require'
      }
    ]
  }
}

// Deploy frontend container app
module frontendContainerApp 'modules/containerapp.bicep' = {
  name: 'frontend-container-app'
  params: {
    name: frontendContainerAppName
    location: location
    environmentId: containerAppsStack.outputs.containerAppsEnvironmentId
    containerImage: frontendContainerImage
    containerPort: 3000
    registryServer: containerAppsStack.outputs.containerRegistryLoginServer
    managedIdentityResourceId: managedIdentity.id
    tags: commonTags
    environmentVariables: [
      {
        name: 'API_URL'
        value: 'https://${backendContainerApp.outputs.fqdn}'
      }
    ]
  }
}

// Outputs
output backendContainerAppFqdn string = backendContainerApp.outputs.fqdn
output frontendContainerAppFqdn string = frontendContainerApp.outputs.fqdn
output containerRegistryLoginServer string = containerAppsStack.outputs.containerRegistryLoginServer
output managedIdentityClientId string = managedIdentity.properties.clientId
output resourceGroupName string = resourceGroup().name
output postgresServerFqdn string = postgresFlexibleServer.outputs.serverFqdn
output azureOpenAIEndpoint string = cognitiveServices.outputs.endpoint
