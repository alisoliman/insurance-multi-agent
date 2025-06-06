@description('The name of the container app environment')
param name string

@description('The location for all resources')
param location string

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2021-06-01' = {
  name: '${name}-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Add an existing alias to avoid calling listKeys() on a resource being created
resource logAnalyticsExisting 'Microsoft.OperationalInsights/workspaces@2021-06-01' existing = {
  name: logAnalytics.name
}

resource environment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: name
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalyticsExisting.listKeys().primarySharedKey
      }
    }
  }
}

output id string = environment.id
output name string = environment.name
