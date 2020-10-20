##
# ml-operator
##
SHELL := /bin/bash
PROJECT = "ml-operator"
DIR = $(shell pwd)

##
# Runners
##
install: .add-secrets
	helm upgrade --install ml-operator ./charts

uninstall:
	helm del ml-operator


##
# Stateful install steps
##
.add-secrets:
	kubectl create secret generic ml-operator-secrets --from-env-file=./charts/.env


##
# Repo Tools
##
.PHONY: clean-repo get-elb


# Get the url of the loadbalancer created by nginx for us
get-elb:
	$(eval ELB=$(shell kubectl get service/nginx-ingress-nginx-controller -o json | jq -r .status.loadBalancer.ingress[0].hostname))
	@echo -e "Run:\n\n    export ELB_URL=$(ELB)\n\nto configure the load balancer url in your local environment"

clean-repo:
	rm -rf $(REPO_DIR)


##
# Monitoring Tools
##
health-check:
	@echo 'Checking health'
	curl -s $(ELB_URL)/image-watcher/health | jq

##
# Kube Tools
##
.PHONY: watch-all switch-kube

# Watch all resources in namespace
watch-all:
	watch -n 1 kubectl get all

# Convenience function to switch back to the kubectx and ns we want
switch-kube:
	kubectx test-scaling
	kubens pisp-lab
	helm list
