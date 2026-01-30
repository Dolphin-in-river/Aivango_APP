package com.mpi.aivango_backend.services.security;

import com.mpi.aivango_backend.models.user.UserAccount;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {

    private final String base64Secret = "YWFiYmNjZGRlZWZmZ2dnaGlpamprbGxtbW5ub29wcHFxcnJzc3R0dXV2dnd3eHh5eXpaWjExMjIzMzQ0NTU2NjY"; // 32 байта
    private final SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(base64Secret));
    private final long expirationMs = 36000000;

    public String generateToken(UserAccount userAccount) {
        return Jwts.builder()
                .setSubject(userAccount.getEmail())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractAllClaims(token).getExpiration().before(new Date());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .setSigningKey(key)
                .parseClaimsJws(token)
                .getBody();
    }
}
