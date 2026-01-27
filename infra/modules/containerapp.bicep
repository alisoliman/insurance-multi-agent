@description('The name of the container app')
param name string

@description('The location for all resources')
param location string

@description('The ID of the container app environment')
param environmentId string

@description('The container image to deploy')
param containerImage string = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'

@description('The container port')
param containerPort int

@description('The container registry server')
param registryServer string

@description('The managed identity resource ID for registry access')
param managedIdentityResourceId string

@description('The managed identity client ID for registry access')
param managedIdentityClientId string

@description('Tags for all resources')
param tags object = {}

@description('The resource prefix for naming')
param resourcePrefix string

@description('Environment variables for the container')
param environmentVariables array = []

@description('Secrets for the container app')
param secrets array = []

// Determine service name based on container app name
var serviceName = contains(name, 'backend') ? 'api' : 'web'

// Create Container App with workload profile specification and required azd tags
resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: name
  location: location
  tags: union(tags, {
    'azd-service-name': serviceName
  })
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentityResourceId}': {}
    }
  }
  properties: {
    environmentId: environmentId
    workloadProfileName: 'Consumption'
    configuration: {
      activeRevisionsMode: 'Single'
      secrets: secrets
      ingress: {
        external: true
        targetPort: containerPort
        allowInsecure: false
        transport: 'auto'
        traffic: [
          {
            weight: 100
            latestRevision: true
          }
        ]
      }
      registries: [
        {
          server: registryServer
          identity: managedIdentityResourceId
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'main'
          image: containerImage
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: concat([
            {
              name: 'PORT'
              value: string(containerPort)
            }
          ], environmentVariables)
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 10
        rules: [
          {
            name: 'http-rule'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

// Outputs
output fqdn string = containerApp.properties.configuration.ingress.fqdn
output name string = containerApp.name
