# azure-workitem

Welcome to the azure-workitem backend plugin!

_This plugin was created through the Backstage CLI_

## Getting started

Your plugin has been added to the example app in this repository, meaning you'll be able to access it by running `yarn
start` in the root directory, wait the server to start and then acessing the plugin endpoints:

* [/azure-workitem/health](http://localhost:7007/api/azure-workitem/health): This endpoint will simply return a JSON with content `{"status" : "ok"}` and requires no authentication;
* [/azure-workitem/hello](http://localhost:7007/api/azure-workitem/hello): This endpoint will thrown a 401 error if not authenticated and can be called setting the `Authorization` header with the proper token. Once authenticated it will return a JSON with content `{"message": "Hello User"}`, where User is the authenticated user. Here's an example to call it using the `curl` utility:

```
curl -vH "Authorization: Bearer ${RHDH_TOKEN}" http://localhost:7007/api/azure-workitem/hello
```

You can also serve the plugin in isolation by running `yarn start` in the plugin directory.
This method of serving the plugin provides quicker iteration speed and a faster startup and hot reloads.
It is only meant for local development, and the setup for it can be found inside the [/dev](/dev) directory.


## Introduction

This backend plugin pulls data from Azure Boards. The corresponding front end plugin for this is available in this repo (https://github.com/arunhari82/backstage-plugin-azure-workitem-dynamic.git)

### Front-end with Data

![Front End Plugin](/docs/Azure%20Boards%20workitem.png)

## Setup package.json

   ### Package json changes 
     setup name to include @<<username>> 
     ```  
           e.g :  replace @anattama with your username or enterprise name
           "name": "@anattama/backstage-plugin-azure-workitem-backend",`
     ```      

## Azure PAT Setup

   Personal access token should have the following previleges

   ```
        Task Groups : Read,Write & Manage
        WorkItems: Read,write & Manage
   ```     

## Run Locally to test

```
   export AZURE_ORG_NAME=<<your azure org name>>
   export AZURE_PERSONAL_ACCESS_TOKEN=<<Your Personal Access Token>>
   yarn start
   curl http://localhost:7007/api/azure-workitem/workitems/<<Azure Project Name>>
```   

## Compile for Dynamic plugin
```
      yarn tsc
      yarn build
      yarn export-dynamic
```


## Package and Publish 
  
### Plugin Architecture Injection
      
![Architecture Diagram](/docs/dynamic-plugin-injection.png)


### Setup .npmrc file
   This file is located in home directory as a hidden file. We need to update this file to reflect the right npmregistry

   Sample .npmrc file shown below In this case Azure Artifactory is being used as npmregistry but we can also uses Nexus,Jfrog artifactory.

   Scope `@anattama:registry` tells the `npm publish` to point which registry

   ```
            ;//nexus-nexus.apps.cluster-jtdkc.sandbox251.opentlc.com/repository/:_authToken=<<Nexus Token>>
            @anattama:registry=https://pkgs.dev.azure.com/anattama/_packaging/mynpmregsitry/npm/registry/
            always-auth=true
            ; begin auth token
            //pkgs.dev.azure.com/anattama/_packaging/mynpmregsitry/npm/registry/:username=anattama
            //pkgs.dev.azure.com/anattama/_packaging/mynpmregsitry/npm/registry/:_password=<<BASE64 Encoded Token>>
            //pkgs.dev.azure.com/anattama/_packaging/mynpmregsitry/npm/registry/:email=<<email_address>>
            //pkgs.dev.azure.com/anattama/_packaging/mynpmregsitry/npm/:username=anattama
            //pkgs.dev.azure.com/anattama/_packaging/mynpmregsitry/npm/:_password=<<BASE64 Encoded Token>>
            //pkgs.dev.azure.com/anattama/_packaging/mynpmregsitry/npm/:email=<<email_address>>
            ; end auth token
   ```
### Packing and  Getting SHA Integrity

      ```
            npm pack --json > ./npminfo.json 
      ``` 
After we execute this command the file `npminfo.json` will have integrity : SHA         

### Publish the plugin

      ```
            npm publish
      ```

## Deploying the plugin with Dev Hub.

### setup secret `dynamic-plugins-npmrc`

This secret contains the registry information please refer to runtime section of architecture diagram above. Sample secret yaml below

```
      kind: Secret
      apiVersion: v1
      metadata:
            name: dynamic-plugins-npmrc
            namespace: backstage
      data:
         .npmrc: <<BASE64 Encoded file content of .npmrc file>>
      type: Opaque

```

Note : this secret must be named as `dynamic-plugins-npmrc` and it should exists in the same namespace  as devhub installed namespace.

### Updating the dynamic plugin config map.
Add the following section to the dynamic plugin configmap

```
 - package: '@<<Username>>/backstage-plugin-azure-workitem-backend@<<Version>>'
        integrity: <<SHA from npminfo.json>>
        disabled: false
```           

### Updating the `app-config` configmap

This plugin requires the following configuration at root level as defined in `config.d.ts` file

```
    integrations:
      azure:
        - host: dev.azure.com
            credentials:
            - personalAccessToken: ${AZURE_PERSONAL_ACCESS_TOKEN}
                organizations:
                - ${AZURE_ORG_NAME}  
```         

### Proceed to configure the frontend plugin for this (https://github.com/arunhari82/backstage-plugin-azure-workitem-dynamic.git)