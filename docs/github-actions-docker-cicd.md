# CI/CD Docker Hub bang GitHub Actions

Tai lieu nay huong dan cau hinh GitHub Actions de sau khi push code len GitHub, repo tu dong build va push Docker images len Docker Hub.

Workflow da duoc tao tai:

```txt
.github/workflows/docker-publish.yml
```

## 1. Images duoc build

Workflow build va push 2 image:

```txt
lequyet/marseille04-client
lequyet/marseille04-server
```

Tag tu dong:

- `latest`: moi khi push vao branch mac dinh `main` hoac `master`.
- `git-<commit-sha>`: tag theo commit de rollback.
- Tag tu nhap: khi chay workflow thu cong bang `workflow_dispatch`.

## 2. Tao Docker Hub access token

Vao Docker Hub:

```txt
Account Settings -> Personal access tokens -> Generate new token
```

Nen chon token co quyen:

```txt
Read & Write
```

Luu token lai de dua vao GitHub Secret.

## 3. Them secrets tren GitHub

Vao repo GitHub:

```txt
Settings -> Secrets and variables -> Actions -> New repository secret
```

Them 2 secret:

```txt
DOCKERHUB_USERNAME=lequyet
DOCKERHUB_TOKEN=<docker-hub-access-token>
```

Khong commit token vao source code.

## 4. Workflow tu dong chay khi nao

Workflow chay khi push vao:

```txt
main
master
```

Va co thay doi trong cac duong dan:

```txt
client/**
server/**
docker-compose*.yml
.github/workflows/docker-publish.yml
```

Neu chi sua docs thi workflow khong build Docker de tiet kiem thoi gian.

## 5. Chay thu cong va tao tag phien ban

Tren GitHub:

```txt
Actions -> Build and Push Docker Images -> Run workflow
```

Nhap `version`, vi du:

```txt
2026-05-30
v1.0.0
```

Workflow se push them tag do cho ca client va server.

## 6. Pull ban moi ve server

Sau khi workflow thanh cong, tren may chay app:

```powershell
docker compose -f docker-compose.hub.yml pull
docker compose -f docker-compose.hub.yml up -d
```

Neu chi muon update client:

```powershell
docker compose -f docker-compose.hub.yml pull client
docker compose -f docker-compose.hub.yml up -d client
```

Neu chi muon update server:

```powershell
docker compose -f docker-compose.hub.yml pull server
docker compose -f docker-compose.hub.yml up -d server
```

## 7. Rollback theo commit

Moi lan build se co tag dang:

```txt
git-<short-sha>
```

Vi du:

```txt
lequyet/marseille04-client:git-a1b2c3d
lequyet/marseille04-server:git-a1b2c3d
```

Muon rollback, sua `docker-compose.hub.yml`:

```yaml
client:
  image: lequyet/marseille04-client:git-a1b2c3d

server:
  image: lequyet/marseille04-server:git-a1b2c3d
```

Sau do chay:

```powershell
docker compose -f docker-compose.hub.yml pull
docker compose -f docker-compose.hub.yml up -d
```

## 8. Loi thuong gap

### Login Docker Hub failed

Kiem tra lai GitHub Secrets:

```txt
DOCKERHUB_USERNAME
DOCKERHUB_TOKEN
```

Token phai con han va co quyen `Read & Write`.

### Denied requested access to the resource

Nguyen nhan thuong gap:

- Sai username Docker Hub.
- Token khong co quyen push.
- Repo Docker Hub thuoc namespace khac.

### Workflow khong chay sau khi push

Kiem tra:

- Push co vao branch `main` hoac `master` khong.
- Commit co sua file trong `client/**`, `server/**`, `docker-compose*.yml` hoac workflow khong.
- Tab `Actions` tren GitHub co bi disable khong.

