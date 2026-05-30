# Huong dan pull va chay du an tu Docker Hub

Tai lieu nay danh cho nguoi khong can source code, chi can pull image tu Docker Hub ve va chay web.

Image da push:

- `lequyet/marseille04-client:latest`
- `lequyet/marseille04-server:latest`
- `lequyet/marseille04-client:2026-05-30`
- `lequyet/marseille04-server:2026-05-30`

Ung dung gom 3 container:

- `marseille04-client`: frontend React da build, chay bang Nginx.
- `marseille04-server`: backend Node.js/Express API.
- `marseille04-mongo`: MongoDB 7.

## 1. Yeu cau may chay

Can cai dat:

- Docker Desktop
- Docker Compose

Kiem tra:

```powershell
docker --version
docker compose version
docker info
```

Neu `docker info` bao loi, hay mo Docker Desktop va doi den khi Docker Engine da running.

## 2. Tao thu muc chay app

Nguoi dung co the tao mot thu muc moi, khong can clone source code:

```powershell
mkdir marseille04-run
cd marseille04-run
```

Quan trong: tat ca lenh `docker compose ...` phai chay trong dung thu muc dang chua file compose.

Neu file ten la `docker-compose.yml`, dung:

```powershell
docker compose pull
docker compose up -d
```

Neu file ten la `docker-compose.hub.yml`, dung:

```powershell
docker compose -f docker-compose.hub.yml pull
docker compose -f docker-compose.hub.yml up -d
```

Quy uoc cho toan bo tai lieu:

- Neu file cua ban ten `docker-compose.yml`, giu nguyen cac lenh dang bat dau bang `docker compose`.
- Neu file cua ban ten `docker-compose.hub.yml`, thay `docker compose` bang `docker compose -f docker-compose.hub.yml`.

Vi du:

```powershell
docker compose logs -f server
```

se thanh:

```powershell
docker compose -f docker-compose.hub.yml logs -f server
```

## 3. Tao file docker-compose.yml

Tao file `docker-compose.yml` trong thu muc vua tao voi noi dung sau:

```yaml
services:
  mongo:
    image: mongo:7
    container_name: marseille04-mongo
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.adminCommand('ping').ok"]
      interval: 10s
      timeout: 5s
      retries: 5

  server:
    image: lequyet/marseille04-server:latest
    container_name: marseille04-server
    restart: unless-stopped
    environment:
      PORT: 3001
      CLIENT_ORIGIN: http://localhost:5173
      MONGODB_URI: mongodb://mongo:27017/marseille04_shop
      MONGODB_SERVER_SELECTION_TIMEOUT_MS: 10000
      JWT_SECRET: change-this-secret-in-production
      TOKEN_EXPIRES_IN_SECONDS: 604800
      ADMIN_EMAIL: test@gmail.com
    ports:
      - "3001:3001"
    volumes:
      - server-uploads:/app/uploads
    depends_on:
      mongo:
        condition: service_healthy

  client:
    image: lequyet/marseille04-client:latest
    container_name: marseille04-client
    restart: unless-stopped
    ports:
      - "5173:80"
    depends_on:
      - server

volumes:
  mongo-data:
  server-uploads:
```

Trong repo nay da co san file tuong tu la `docker-compose.hub.yml`.

## 4. Pull image tu Docker Hub

Chay lenh:

```powershell
docker compose pull
```

Lenh tren chi dung khi file cua ban ten la `docker-compose.yml`.

Neu ban dung file co san trong repo nay la `docker-compose.hub.yml`, chay:

```powershell
docker compose -f docker-compose.hub.yml pull
```

Neu muon pull tag co dinh thay vi `latest`, sua image trong compose:

```yaml
image: lequyet/marseille04-client:2026-05-30
image: lequyet/marseille04-server:2026-05-30
```

Sau do chay lai:

```powershell
docker compose pull
```

Hoac neu file ten `docker-compose.hub.yml`:

```powershell
docker compose -f docker-compose.hub.yml pull
```

## 5. Khoi dong app

Chay:

```powershell
docker compose up -d
```

Lenh tren chi dung khi file cua ban ten la `docker-compose.yml`.

Neu ban dung file `docker-compose.hub.yml`, chay:

```powershell
docker compose -f docker-compose.hub.yml up -d
```

Kiem tra container:

```powershell
docker ps
```

Can thay 3 container dang chay:

```txt
marseille04-client
marseille04-server
marseille04-mongo
```

Mo trinh duyet:

- Web: `http://localhost:5173`
- API: `http://localhost:3001/api/shop/products`

## 6. Nap du lieu test

Lan dau chay database se rong. De them du lieu test:

```powershell
docker compose exec server npm run seed
```

Tai khoan admin test:

```txt
Email: test@gmail.com
Password: 123456
```

Sau khi seed, vao:

```txt
http://localhost:5173/login
```

Dang nhap bang tai khoan tren, sau do vao trang quan ly:

```txt
http://localhost:5173/admin/overview
```

## 7. Xem log khi co loi

Xem log tat ca service:

```powershell
docker compose logs -f
```

Xem log backend:

```powershell
docker compose logs -f server
```

Xem log frontend:

```powershell
docker compose logs -f client
```

Xem log MongoDB:

```powershell
docker compose logs -f mongo
```

## 8. Dung va khoi dong lai

Dung container nhung giu database va anh upload:

```powershell
docker compose down
```

Chay lai:

```powershell
docker compose up -d
```

Restart rieng backend:

```powershell
docker compose restart server
```

Restart rieng frontend:

```powershell
docker compose restart client
```

## 9. Cap nhat image moi tu Docker Hub

Khi co ban moi:

```powershell
docker compose pull
docker compose up -d
```

Neu muon chac chan recreate container:

```powershell
docker compose up -d --force-recreate
```

## 10. Xoa toan bo du lieu local

Lenh nay xoa container va volume, bao gom database MongoDB va anh upload:

```powershell
docker compose down -v
```

Chi dung khi muon reset sach du lieu.

## 11. Cau hinh bien moi truong

Cac bien quan trong trong service `server`:

```yaml
ADMIN_EMAIL: test@gmail.com
JWT_SECRET: change-this-secret-in-production
CLIENT_ORIGIN: http://localhost:5173
MONGODB_URI: mongodb://mongo:27017/marseille04_shop
```

Khi chay that nen doi:

- `JWT_SECRET`: chuoi bi mat manh.
- `ADMIN_EMAIL`: email admin that.
- `CLIENT_ORIGIN`: domain frontend that, vi du `https://shop.example.com`.

Neu doi port frontend, vi du tu `5173` sang `8080`:

```yaml
client:
  ports:
    - "8080:80"

server:
  environment:
    CLIENT_ORIGIN: http://localhost:8080
```

Sau do truy cap:

```txt
http://localhost:8080
```

## 12. Loi thuong gap

### No configuration file provided: not found

Loi:

```txt
no configuration file provided: not found
```

Nguyen nhan:

- Ban dang chay `docker compose up -d` o thu muc khong co file `docker-compose.yml`.
- File compose dang ten `docker-compose.hub.yml` nhung lenh khong co `-f`.
- File bi luu sai ten, vi du `docker-compose.yml.txt`.

Cach xu ly:

1. Kiem tra file trong thu muc hien tai:

```powershell
dir
```

2. Neu thay file `docker-compose.yml`, chay:

```powershell
docker compose pull
docker compose up -d
```

3. Neu thay file `docker-compose.hub.yml`, chay:

```powershell
docker compose -f docker-compose.hub.yml pull
docker compose -f docker-compose.hub.yml up -d
```

4. Neu khong thay file compose, tao lai file theo muc 3 cua tai lieu nay.

### Docker Engine chua chay

Loi thuong gap:

```txt
permission denied while trying to connect to the docker API
```

Cach xu ly:

- Mo Docker Desktop.
- Doi Docker Engine chay xong.
- Chay lai `docker info`.

### Port da bi dung

Neu port `5173`, `3001` hoac `27017` da bi dung, doi port ben trai:

```yaml
ports:
  - "8080:80"
```

Ben trai la port tren may host, ben phai la port trong container.

### Web chay nhung API loi

Kiem tra backend:

```powershell
docker compose logs -f server
```

Kiem tra Mongo:

```powershell
docker compose logs -f mongo
```

Neu database moi tao chua co du lieu, chay:

```powershell
docker compose exec server npm run seed
```

### Anh upload bi mat sau khi reset

Anh san pham upload nam trong volume:

```txt
server-uploads
```

Khong chay `docker compose down -v` neu muon giu anh va database.

## 13. Lenh nhanh

Pull va chay:

```powershell
docker compose pull
docker compose up -d
```

Seed du lieu:

```powershell
docker compose exec server npm run seed
```

Xem trang web:

```txt
http://localhost:5173
```

Dang nhap admin:

```txt
test@gmail.com / 123456
```
