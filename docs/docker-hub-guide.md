# Huong dan Docker va Docker Hub

Tai lieu nay dung cho du an Marseille04 Shop gom 3 thanh phan:

- `client`: React/Vite build production va chay bang Nginx.
- `server`: Node.js/Express API.
- `mongo`: MongoDB 7 dung image chinh thuc tu Docker Hub.

Neu nguoi dung chi muon pull image tu Docker Hub va chay app, xem huong dan rieng:

- `docs/docker-hub-pull-guide.md`

## 1. Chuan bi

Can cai dat:

- Docker Desktop
- Docker Compose
- Tai khoan Docker Hub

Kiem tra Docker:

```powershell
docker --version
docker compose version
docker info
```

Dang nhap Docker Hub:

```powershell
docker login
```

## 2. Build image local

Chay tai thu muc goc du an:

```powershell
docker compose build
```

Image local duoc tao:

```txt
something-client:latest
something-server:latest
```

Kiem tra image:

```powershell
docker image ls
```

## 3. Chay du an bang Docker Compose

Chay toan bo app:

```powershell
docker compose up -d
```

Truy cap:

- Web: `http://localhost:5173`
- API: `http://localhost:3001/api/shop`
- MongoDB: `mongodb://localhost:27017/marseille04_shop`

Xem log:

```powershell
docker compose logs -f
```

Dung app:

```powershell
docker compose down
```

Dung app va xoa volume database/uploads:

```powershell
docker compose down -v
```

## 4. Tag image de push Docker Hub

Namespace Docker Hub dang su dung cho du an nay la `lequyet`.

```powershell
docker tag something-client:latest lequyet/marseille04-client:latest
docker tag something-server:latest lequyet/marseille04-server:latest
```

Nen tao them tag theo ngay/phien ban de de rollback:

```powershell
docker tag something-client:latest lequyet/marseille04-client:2026-05-30
docker tag something-server:latest lequyet/marseille04-server:2026-05-30
```

## 5. Push len Docker Hub

```powershell
docker push lequyet/marseille04-client:latest
docker push lequyet/marseille04-server:latest
docker push lequyet/marseille04-client:2026-05-30
docker push lequyet/marseille04-server:2026-05-30
```

Sau khi push thanh cong, kiem tra tren Docker Hub:

- `https://hub.docker.com/r/lequyet/marseille04-client`
- `https://hub.docker.com/r/lequyet/marseille04-server`

## 6. Chay tu image tren Docker Hub

Co the thay phan `build` trong `docker-compose.yml` bang `image`:

```yaml
server:
  image: lequyet/marseille04-server:latest

client:
  image: lequyet/marseille04-client:latest
```

Sau do chay:

```powershell
docker compose pull
docker compose up -d
```

## 7. Bien moi truong quan trong

Trong `docker-compose.yml`, server dang dung:

```yaml
PORT: 3001
CLIENT_ORIGIN: http://localhost:5173
MONGODB_URI: mongodb://mongo:27017/marseille04_shop
JWT_SECRET: change-this-secret-in-production
TOKEN_EXPIRES_IN_SECONDS: 604800
ADMIN_EMAIL: test@gmail.com
```

Khi deploy that, can doi:

- `JWT_SECRET`: dung chuoi bi mat manh, khong commit len Git.
- `ADMIN_EMAIL`: email admin that.
- `CLIENT_ORIGIN`: domain frontend that.
- `MONGODB_URI`: URI MongoDB production neu khong dung Mongo container.

## 8. Upload anh san pham

Server luu anh upload vao volume:

```yaml
server-uploads:/app/uploads
```

Khong xoa volume nay neu muon giu anh san pham da upload.

## 9. Lenh huu ich

Build lai khong dung cache:

```powershell
docker compose build --no-cache
```

Restart service:

```powershell
docker compose restart server
docker compose restart client
```

Xem container:

```powershell
docker ps
```

Xem log rieng tung service:

```powershell
docker compose logs -f server
docker compose logs -f client
docker compose logs -f mongo
```

Seed du lieu test trong container server:

```powershell
docker compose exec server npm run seed
```
