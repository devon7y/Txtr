//
//  GameScene.swift
//  MillionDallarAppGameTest
//
//  Created by Devon Yanitski on 2019-01-03.
//  Copyright © 2019 Devon Yanitski. All rights reserved.
//

import SpriteKit
import GameplayKit

class GameScene: SKScene, SKPhysicsContactDelegate {
    weak var viewController: ViewController!
    weak var settingsMenuViewController: SettingsMenuViewController!
    var isGameOver = false
    var gameTimer: Timer!
    var playerCar: SKSpriteNode!
    var enemy: SKSpriteNode!
    
    
    var possibleEnemySpawnLocations = [CGPoint(x: 0, y: 400), CGPoint(x: 110, y: 400), CGPoint(x: -110, y: 400)]
    
//    let playerCar = PlayerCar(imagedNamed: "redcargame")
    
    override func didMove(to view: SKView) {
        createBackground()
        createRoadLoop()
        createPlayerCar()
        
        physicsWorld.contactDelegate = self
        physicsWorld.gravity = CGVector(dx: 0.0, dy: 0.0)
//        addChild(playerCar)
        
        
    }
    
    func startGame() {
        gameTimer = Timer.scheduledTimer(timeInterval: 1.25, target: self, selector: #selector(createEnemy), userInfo: nil, repeats: true)
        
    }
    
    func restartGame() {
        speed = 1.0
        createPlayerCar()
        createRoadLoop()
        createBackground()
    }
    
    @objc func createEnemy() {
        let enemyTexture = SKTexture(imageNamed: "policecargame2")
        
        enemy = SKSpriteNode(texture: enemyTexture)
        possibleEnemySpawnLocations.shuffle()
        enemy.position = possibleEnemySpawnLocations[0]
        enemy.size = CGSize(width: enemyTexture.size().width * 0.20, height: enemyTexture.size().height * 0.20)
        enemy.zPosition = 10
        
        addChild(enemy)
        
        enemy.physicsBody = SKPhysicsBody(texture: enemyTexture, size: CGSize(width: enemyTexture.size().width * 0.20, height: enemyTexture.size().height * 0.20))
        enemy.physicsBody?.isDynamic = true
        enemy.physicsBody?.velocity = CGVector(dx: 0, dy: -300)
        enemy.physicsBody?.angularVelocity = 0
        enemy.physicsBody?.linearDamping = 0
        enemy.physicsBody?.angularDamping = 0
    }
    
    func removeEnemy() {
        enemy.removeFromParent()
    }
    
    func createBackground() {
        let backgroundTexture = SKTexture(imageNamed: "justgrass")
        
        let grass = SKSpriteNode(texture: backgroundTexture)
//        grass.zPosition = -40
        grass.anchorPoint = CGPoint(x: 0.5, y: 0.5)
        grass.position = CGPoint(x: 0, y: 0)
        addChild(grass)
        grass.zPosition = -10
        
        grass.physicsBody = SKPhysicsBody(texture: backgroundTexture, size: backgroundTexture.size())
        grass.physicsBody?.isDynamic = false
        
        let grass2 = SKSpriteNode(texture: backgroundTexture)
        grass2.anchorPoint = CGPoint(x: 0.5, y: 0.5)
        grass2.position = CGPoint(x: 348, y: 0)
        addChild(grass2)
        grass2.zPosition = -10
        
        grass2.physicsBody = SKPhysicsBody(texture: backgroundTexture, size: backgroundTexture.size())
        grass2.physicsBody?.isDynamic = false
    }
    
    func createRoadLoop() {
        let roadTexture = SKTexture(imageNamed: "loopingroad2")
        
        for numberOfBackgrounds in 0 ... 1 {
            print("done")
            let road = SKSpriteNode(texture: roadTexture)
            road.zPosition = -10
//            road.anchorPoint = CGPoint.zero
            road.position = CGPoint(x: 0, y: (roadTexture.size().height * CGFloat(numberOfBackgrounds)) - CGFloat(1 * numberOfBackgrounds))
            
            addChild(road)
            
            let moveLeft = SKAction.moveBy(x: 0, y: -667, duration: 3)
            let moveReset = SKAction.moveBy(x: 0, y: 667, duration: 0)
            let moveLoop = SKAction.sequence([moveLeft, moveReset])
            let moveForever = SKAction.repeatForever(moveLoop)
            
            road.run(moveForever)
        }
        
    }
    
    func createPlayerCar() {

        let playerCarTexture = SKTexture(imageNamed: "redcargame")
        playerCar = SKSpriteNode(imageNamed: "redcargame")


        playerCar.position = CGPoint(x: 0, y: -20)
        playerCar.size = CGSize(width: playerCarTexture.size().width * 0.20, height: playerCarTexture.size().height * 0.20)
        playerCar.zPosition = 10

        addChild(playerCar)

        playerCar.physicsBody = SKPhysicsBody(texture: playerCarTexture, size: CGSize(width: playerCarTexture.size().width * 0.20, height: playerCarTexture.size().height * 0.20))
        playerCar.physicsBody!.contactTestBitMask = playerCar.physicsBody!.collisionBitMask
        playerCar.physicsBody?.isDynamic = true
        
        playerCar.physicsBody?.collisionBitMask = 0
    }
    
    
    
    func changeToLeftLane() {
        print("left")
        let startLeft = SKAction.moveBy(x: -55, y: 0, duration: 0.2)
        let turn = SKAction.rotate(toAngle: 0.60, duration: 0.2)
        let finishLeft = SKAction.moveBy(x: -55, y: 0, duration: 0.2)
        let straightenOut = SKAction.rotate(toAngle: 0, duration: 0.2)
        let group = SKAction.group([startLeft, turn])
        let group2 = SKAction.group([finishLeft, straightenOut])
        let moveSequence = SKAction.sequence([group, group2])
        playerCar.run(moveSequence)
    }
    
    func changeToRightLane() {
        print("right")
        let startRight = SKAction.moveBy(x: 55, y: 0, duration: 0.2)
        let turn = SKAction.rotate(toAngle: -0.60, duration: 0.2)
        let finishRight = SKAction.moveBy(x: 55, y: 0, duration: 0.2)
        let straightenOut = SKAction.rotate(toAngle: 0, duration: 0.2)
        let group = SKAction.group([startRight, turn])
        let group2 = SKAction.group([finishRight, straightenOut])
        let moveSequence = SKAction.sequence([group, group2])
        playerCar.run(moveSequence)
    }
    
    override func update(_ currentTime: TimeInterval) {
        for node in children {
            if node.position.y < -1000 {
                node.removeFromParent()
            }
        }
        
    }
    
    func didBegin(_ contact: SKPhysicsContact) {
        print("didbegincontact")

        guard contact.bodyA.node != nil && contact.bodyB.node != nil else {
            return
        }

        if contact.bodyA.node == playerCar || contact.bodyB.node == playerCar {
            print("contact")
            gameOver()
        }
    }
    
    func gameOver() {
        if let explosion = SKEmitterNode(fileNamed: "hitPlayer") {
            explosion.position = playerCar.position
            addChild(explosion)
        }
        
        gameTimer.invalidate()
        isGameOver = true
        print("Game over: \(isGameOver)")
        playerCar.removeFromParent()
//        enemy.removeFromParent()
        speed = 0
    }
    
    
    func touchDown(atPoint pos : CGPoint) {
        
    }
    
    func touchMoved(toPoint pos : CGPoint) {
        
    }
    
    func touchUp(atPoint pos : CGPoint) {
        
    }
    
    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        
        
    }
    
    
    
    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        
    }
    
    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        
    }
    
    
    
}
