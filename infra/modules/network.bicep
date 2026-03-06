@description('The location for all resources')
param location string = resourceGroup().location

@description('Tags for all resources')
param tags object = {}

@description('Resource suffix used for naming')
param resourceSuffix string

@description('Address prefix for the application virtual network')
param virtualNetworkAddressPrefix string = '10.20.0.0/16'

@description('Address prefix for the Container Apps infrastructure subnet')
param containerAppsSubnetPrefix string = '10.20.0.0/27'

@description('Address prefix for the PostgreSQL delegated subnet')
param postgresSubnetPrefix string = '10.20.1.0/28'

var virtualNetworkName = 'vnet-${resourceSuffix}'
var privateDnsZoneName = 'pgsql-${resourceSuffix}.postgres.database.azure.com'

resource virtualNetwork 'Microsoft.Network/virtualNetworks@2023-11-01' = {
  name: virtualNetworkName
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        virtualNetworkAddressPrefix
      ]
    }
  }
}

resource containerAppsSubnet 'Microsoft.Network/virtualNetworks/subnets@2023-11-01' = {
  parent: virtualNetwork
  name: 'container-apps'
  properties: {
    addressPrefix: containerAppsSubnetPrefix
    delegations: [
      {
        name: 'container-apps-delegation'
        properties: {
          serviceName: 'Microsoft.App/environments'
        }
      }
    ]
  }
}

resource postgresSubnet 'Microsoft.Network/virtualNetworks/subnets@2023-11-01' = {
  parent: virtualNetwork
  name: 'postgres'
  properties: {
    addressPrefix: postgresSubnetPrefix
    delegations: [
      {
        name: 'postgres-delegation'
        properties: {
          serviceName: 'Microsoft.DBforPostgreSQL/flexibleServers'
        }
      }
    ]
  }
}

resource privateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: privateDnsZoneName
  location: 'global'
  tags: tags
}

resource privateDnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: privateDnsZone
  name: '${virtualNetworkName}-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: virtualNetwork.id
    }
  }
}

output virtualNetworkId string = virtualNetwork.id
output containerAppsInfrastructureSubnetId string = containerAppsSubnet.id
output postgresDelegatedSubnetId string = postgresSubnet.id
output privateDnsZoneId string = privateDnsZone.id
output privateDnsZoneName string = privateDnsZone.name
