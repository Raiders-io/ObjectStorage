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

save:
	docker run --rm -v objectstorage_object-storage-data:/volume_storage-data -v $(shell pwd):/backup ubuntu tar cvf /backup/backup_storage-data.tar /volume_storage-data
	docker run --rm -v objectstorage_object-storage-meta:/volume_storage-meta -v $(shell pwd):/backup ubuntu tar cvf /backup/backup_storage-meta.tar /volume_storage-meta
	docker run --rm -v objectstorage_object-db-data:/volume_db-data -v $(shell pwd):/backup ubuntu tar cvf /backup/backup_db-data.tar /volume_db-data

backup:
	docker run --rm -v objectstorage_object-storage-data:/volume_storage-data -v $(shell pwd):/backup ubuntu tar xvf /backup/backup_storage-data.tar -C .
	docker run --rm -v objectstorage_object-storage-meta:/volume_storage-meta -v $(shell pwd):/backup ubuntu tar xvf /backup/backup_storage-meta.tar -C .
	docker run --rm -v objectstorage_object-db-data:/volume_db-data -v $(shell pwd):/backup ubuntu tar xvf /backup/backup_db-data.tar -C .

open:
	tar -xf backup_storage-data.tar
	tar -xf backup_storage-meta.tar
	tar -xf backup_db-data.tar

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
