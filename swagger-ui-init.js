
window.onload = function() {
  // Build a system
  var url = window.location.search.match(/url=([^&]+)/);
  if (url && url.length > 1) {
    url = decodeURIComponent(url[1]);
  } else {
    url = window.location.origin;
  }
  var options = {
  "swaggerDoc": {
    "openapi": "3.0.0",
    "info": {
      "title": "Gooum API",
      "version": "1.0.0",
      "description": "Gooum 프로젝트 API 문서"
    },
    "servers": [
      {
        "url": "/"
      }
    ],
    "components": {
      "securitySchemes": {
        "bearerAuth": {
          "type": "http",
          "scheme": "bearer",
          "bearerFormat": "JWT"
        }
      }
    },
    "paths": {
      "/api/users/me": {
        "get": {
          "tags": [
            "Users"
          ],
          "summary": "내 프로필 조회",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "성공"
            }
          }
        },
        "patch": {
          "tags": [
            "Users"
          ],
          "summary": "내 프로필 수정",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "name": {
                      "type": "string"
                    },
                    "statusMessage": {
                      "type": "string"
                    },
                    "profileImageUrl": {
                      "type": "string"
                    },
                    "theme": {
                      "type": "object",
                      "properties": {
                        "mode": {
                          "type": "string",
                          "enum": [
                            "light",
                            "dark"
                          ]
                        }
                      }
                    },
                    "notificationSettings": {
                      "type": "object",
                      "properties": {
                        "message": {
                          "type": "boolean"
                        },
                        "mention": {
                          "type": "boolean"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "수정 성공"
            }
          }
        }
      },
      "/api/users": {
        "get": {
          "tags": [
            "Users"
          ],
          "summary": "유저 목록 조회",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "이름 검색"
            }
          ],
          "responses": {
            "200": {
              "description": "성공"
            }
          }
        }
      },
      "/api/users/{userId}": {
        "get": {
          "tags": [
            "Users"
          ],
          "summary": "특정 유저 조회",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "userId",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "성공"
            },
            "404": {
              "description": "유저 없음"
            }
          }
        }
      },
      "/api/rooms": {
        "post": {
          "tags": [
            "Rooms"
          ],
          "summary": "채팅방 생성",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "type": {
                      "type": "string",
                      "enum": [
                        "direct",
                        "group"
                      ]
                    },
                    "name": {
                      "type": "string"
                    },
                    "memberIds": {
                      "type": "array",
                      "items": {
                        "type": "string"
                      }
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "생성 성공"
            },
            "400": {
              "description": "잘못된 요청"
            }
          }
        },
        "get": {
          "tags": [
            "Rooms"
          ],
          "summary": "내 채팅방 목록 조회",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "성공"
            }
          }
        }
      },
      "/api/rooms/{roomId}": {
        "get": {
          "tags": [
            "Rooms"
          ],
          "summary": "채팅방 상세 조회",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "roomId",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "성공"
            },
            "403": {
              "description": "멤버가 아님"
            },
            "404": {
              "description": "채팅방 없음"
            }
          }
        },
        "delete": {
          "tags": [
            "Rooms"
          ],
          "summary": "채팅방 나가기",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "roomId",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "성공"
            },
            "404": {
              "description": "채팅방 없음"
            }
          }
        }
      },
      "/api/rooms/{roomId}/favorite": {
        "patch": {
          "tags": [
            "Rooms"
          ],
          "summary": "채팅방 즐겨찾기 토글",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "roomId",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "isFavorite": {
                      "type": "boolean"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "성공"
            }
          }
        }
      },
      "/api/documents": {
        "post": {
          "tags": [
            "Documents"
          ],
          "summary": "문서 생성",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "title": {
                      "type": "string"
                    },
                    "roomId": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "생성 성공"
            },
            "403": {
              "description": "채팅방 멤버가 아님"
            }
          }
        },
        "get": {
          "tags": [
            "Documents"
          ],
          "summary": "문서 목록 조회",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "roomId",
              "schema": {
                "type": "string"
              },
              "description": "특정 채팅방 문서만 필터"
            },
            {
              "in": "query",
              "name": "type",
              "schema": {
                "type": "string",
                "enum": [
                  "document",
                  "ai_summary"
                ]
              },
              "description": "문서 타입 필터"
            }
          ],
          "responses": {
            "200": {
              "description": "성공"
            }
          }
        }
      },
      "/api/documents/{documentId}": {
        "get": {
          "tags": [
            "Documents"
          ],
          "summary": "문서 상세 조회",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "documentId",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "성공"
            },
            "403": {
              "description": "접근 권한 없음"
            },
            "404": {
              "description": "문서 없음"
            }
          }
        },
        "patch": {
          "tags": [
            "Documents"
          ],
          "summary": "문서 저장 (자동 저장)",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "documentId",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "title": {
                      "type": "string"
                    },
                    "content": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "저장 성공"
            },
            "403": {
              "description": "접근 권한 없음"
            },
            "404": {
              "description": "문서 없음"
            }
          }
        },
        "delete": {
          "tags": [
            "Documents"
          ],
          "summary": "문서 삭제",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "documentId",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "삭제 성공"
            },
            "403": {
              "description": "생성자만 삭제 가능"
            },
            "404": {
              "description": "문서 없음"
            }
          }
        }
      },
      "/api/auth/login": {
        "post": {
          "tags": [
            "Auth"
          ],
          "summary": "카카오 로그인",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": {
                      "type": "string",
                      "description": "카카오 인가 코드"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "로그인 성공"
            },
            "401": {
              "description": "카카오 인증 실패"
            }
          }
        }
      },
      "/api/auth/logout": {
        "post": {
          "tags": [
            "Auth"
          ],
          "summary": "로그아웃",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "로그아웃 성공"
            }
          }
        }
      }
    },
    "tags": []
  },
  "customOptions": {}
};
  url = options.swaggerUrl || url
  var urls = options.swaggerUrls
  var customOptions = options.customOptions
  var spec1 = options.swaggerDoc
  var swaggerOptions = {
    spec: spec1,
    url: url,
    urls: urls,
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout"
  }
  for (var attrname in customOptions) {
    swaggerOptions[attrname] = customOptions[attrname];
  }
  var ui = SwaggerUIBundle(swaggerOptions)

  if (customOptions.oauth) {
    ui.initOAuth(customOptions.oauth)
  }

  if (customOptions.preauthorizeApiKey) {
    const key = customOptions.preauthorizeApiKey.authDefinitionKey;
    const value = customOptions.preauthorizeApiKey.apiKeyValue;
    if (!!key && !!value) {
      const pid = setInterval(() => {
        const authorized = ui.preauthorizeApiKey(key, value);
        if(!!authorized) clearInterval(pid);
      }, 500)

    }
  }

  if (customOptions.authAction) {
    ui.authActions.authorize(customOptions.authAction)
  }

  window.ui = ui
}
