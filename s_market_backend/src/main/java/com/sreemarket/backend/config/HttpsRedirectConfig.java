package com.sreemarket.backend.config;

import org.apache.catalina.connector.Connector;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.servlet.server.ServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configures an additional HTTP connector on port 8082 that redirects all traffic
 * to the main HTTPS connector on port 8443.
 * 
 * This allows users who accidentally use http:// to be automatically redirected
 * to https:// for secure communication.
 * Only active when SSL is enabled.
 */
@Configuration
@ConditionalOnProperty(name = "server.ssl.enabled", havingValue = "true")
public class HttpsRedirectConfig {

    @Value("${server.http.port:8082}")
    private int httpPort;

    @Value("${server.port:8443}")
    private int httpsPort;

    @Bean
    public ServletWebServerFactory servletContainer() {
        TomcatServletWebServerFactory tomcat = new TomcatServletWebServerFactory() {
            @Override
            protected void postProcessContext(org.apache.catalina.Context context) {
                // Enable HTTP-to-HTTPS redirect in security constraints
                org.apache.tomcat.util.descriptor.web.SecurityConstraint securityConstraint = 
                    new org.apache.tomcat.util.descriptor.web.SecurityConstraint();
                securityConstraint.setUserConstraint("CONFIDENTIAL");
                org.apache.tomcat.util.descriptor.web.SecurityCollection collection = 
                    new org.apache.tomcat.util.descriptor.web.SecurityCollection();
                collection.addPattern("/*");
                securityConstraint.addCollection(collection);
                context.addConstraint(securityConstraint);
            }
        };

        // Add an HTTP connector that redirects to HTTPS
        Connector connector = new Connector("org.apache.coyote.http11.Http11NioProtocol");
        connector.setScheme("http");
        connector.setPort(httpPort);
        connector.setSecure(false);
        connector.setRedirectPort(httpsPort);

        tomcat.addAdditionalTomcatConnectors(connector);
        return tomcat;
    }
}
