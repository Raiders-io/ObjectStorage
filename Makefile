.PHONY : all clean fclean re debug debug-print ObjectStorage env
NO_DIR = --no-print-directory
MAKE := $(MAKE) $(NO_DIR)
# MAKE := $(MAKE) -j $(NO_DIR)
NAME = ObjectStorage

all:
	@$(MAKE) $(NAME)

$(NAME):
	docker network create public-network || true
	docker compose up -d --build --force-recreate --remove-orphans

env:
	@chmod +x ./setup_env.sh
	@./setup_env.sh

up:
	docker compose up -d

down:
	docker compose down

ls: list
list:
	docker ps

status:
	docker ps

status-all:
	docker ps -a


stop-all:
	docker stop $(shell docker ps -q)

clean:
clean-all:
	docker system prune --all -f

clean-all-volumes:
	docker volume rm $(shell docker volume ls -q)

reset:
	@$(MAKE) stop-all || true
	@$(MAKE) clean-all  || true
	@$(MAKE) clean-all-volumes || true
	@$(MAKE) rm-volumes

fclean:
	@$(MAKE) clean-all

re:
	@$(MAKE) fclean
	@$(MAKE) all

debug-print:
	@ls -Al -R --color=auto --ignore=.git
