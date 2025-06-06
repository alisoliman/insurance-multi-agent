@description('The resource ID of the container registry')
param registryId string

@description('The principal ID of the managed identity')
param managedIdentityPrincipalId string

@description('The resource prefix for naming')
param resourcePrefix string

// Get reference to the existing registry with supported API version for swedencentral
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = {
  name: last(split(registryId, '/'))
}

// Assign AcrPull role to the managed identity with improved naming
resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(registryId, managedIdentityPrincipalId, 'AcrPull')
  scope: containerRegistry
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d') // AcrPull role
    principalId: managedIdentityPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// Output for verification
output roleAssignmentId string = roleAssignment.id
output roleDefinitionName string = 'AcrPull'
