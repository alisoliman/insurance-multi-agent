@description('Name of the container apps environment')
param containerAppsEnvironmentName string

@description('Name of the container registry')
param containerRegistryName string

@description('Location for all resources')
param location string = resourceGroup().location

@description('Tags for all resources')
param tags object = {}

@description('The project name for resource naming')
param projectName string

@description('The environment name')
param environmentName string

// Default configuration for any environment
var defaultConfig = {
  registrySku: 'Standard'
  workspaceRetentionDays: 30
}

// Production-specific configuration (for environments containing 'prod')
var prodConfig = {
  registrySku: 'Premium'
  workspaceRetentionDays: 90
}

// Determine configuration based on environment name patterns
var config = contains(toLower(environmentName), 'prod') ? prodConfig : defaultConfig

// Create Log Analytics workspace for Container Apps Environment
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'law-${containerAppsEnvironmentName}'
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: config.workspaceRetentionDays
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

// Create Container Registry with supported SKU
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: containerRegistryName
  location: location
  tags: tags
  sku: {
    name: config.registrySku
  }
  properties: {
    adminUserEnabled: false
    policies: {
      quarantinePolicy: {
        status: 'disabled'
      }
      trustPolicy: {
        type: 'Notary'
        status: 'disabled'
      }
      retentionPolicy: {
        days: 7
        status: 'disabled'
      }
    }
    encryption: {
      status: 'disabled'
    }
    dataEndpointEnabled: false
    publicNetworkAccess: 'Enabled'
    networkRuleBypassOptions: 'AzureServices'
    zoneRedundancy: 'Disabled'
  }
}

// Create Container Apps Environment with required workload profile
resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: containerAppsEnvironmentName
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
    workloadProfiles: [
      {
        name: 'Consumption'
        workloadProfileType: 'Consumption'
      }
    ]
  }
}

// Outputs
output containerAppsEnvironmentId string = containerAppsEnvironment.id
output containerRegistryId string = containerRegistry.id
output containerRegistryLoginServer string = containerRegistry.properties.loginServer
output logAnalyticsWorkspaceId string = logAnalyticsWorkspace.id
output containerAppsEnvironmentDefaultDomain string = containerAppsEnvironment.properties.defaultDomain
