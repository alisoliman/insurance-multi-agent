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
var managedIdentityName = 'id-${uniqueSuffix}'
var backendContainerAppName = 'backend-${uniqueSuffix}'
var frontendContainerAppName = 'frontend-${uniqueSuffix}'

// Create managed identity for container registry access
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: managedIdentityName
  location: location
  tags: commonTags
}

// Deploy container apps stack (environment + registry)
module containerAppsStack 'modules/container-apps-stack.bicep' = {
  name: 'container-apps-stack'
  params: {
    containerAppsEnvironmentName: containerAppsEnvironmentName
    containerRegistryName: containerRegistryName
    location: location
    tags: commonTags
    projectName: projectName
    environmentName: environmentName
  }
}

// Assign AcrPull role to managed identity
module roleAssignment 'modules/role-assignment.bicep' = {
  name: 'role-assignment'
  params: {
    registryId: containerAppsStack.outputs.containerRegistryId
    managedIdentityPrincipalId: managedIdentity.properties.principalId
    resourcePrefix: uniqueSuffix
  }
  dependsOn: [
    containerAppsStack
    managedIdentity
  ]
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
    managedIdentityClientId: managedIdentity.properties.clientId
    tags: commonTags
    resourcePrefix: uniqueSuffix
    environmentVariables: [
      {
        name: 'ENVIRONMENT'
        value: 'production'
      }
    ]
  }
  dependsOn: [
    containerAppsStack
    roleAssignment
  ]
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
    managedIdentityClientId: managedIdentity.properties.clientId
    tags: commonTags
    resourcePrefix: uniqueSuffix
    environmentVariables: [
      {
        name: 'API_URL'
        value: 'https://${backendContainerApp.outputs.fqdn}'
      }
    ]
  }
  dependsOn: [
    containerAppsStack
    roleAssignment
    backendContainerApp
  ]
}

// Outputs
output backendContainerAppFqdn string = backendContainerApp.outputs.fqdn
output frontendContainerAppFqdn string = frontendContainerApp.outputs.fqdn
output containerRegistryLoginServer string = containerAppsStack.outputs.containerRegistryLoginServer
output managedIdentityClientId string = managedIdentity.properties.clientId
output resourceGroupName string = resourceGroup().name

