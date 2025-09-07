// MongoDB initialization script
// This script runs only once when the database is first created
db.getSiblingDB('zkmusic').createUser({
  user: 'zkmusic',
  pwd: 'zkmusic123',
  roles: [
    {
      role: 'readWrite',
      db: 'zkmusic'
    }
  ]
});

print('MongoDB user "zkmusic" created successfully for database "zkmusic"');
