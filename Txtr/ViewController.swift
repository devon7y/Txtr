//
//  ViewController.swift
//  Txtr
//
//  Created by Devon Yanitski on 2019-01-05.
//  Copyright © 2019 Devon Yanitski. All rights reserved.
//

import UIKit
import SpriteKit
import GameplayKit

// IDEA: Make players final score = scoreLabel * timerLabel

class ViewController: UIViewController, UITextFieldDelegate {
    var game: GameScene!
    
    @IBOutlet weak var blurView: UIVisualEffectView!
    @IBOutlet weak var scoreBlurBackground: UIVisualEffectView!
    @IBOutlet weak var scoreLabel: UILabel!
    @IBOutlet weak var timerBlurBackground: UIVisualEffectView!
    @IBOutlet weak var gameView: SKView!
    @IBOutlet weak var keyboardView: UIView!
    
    @IBOutlet weak var timerLabel: UILabel!
    
    @IBOutlet weak var startButton: UIButton!
    @IBOutlet weak var outputLabel: UILabel!
    @IBOutlet weak var placeholderLabel: UILabel!
    
    @IBOutlet var letterKeys: [UIButton]!
    @IBOutlet var otherKeys: [UIButton]!
    @IBOutlet weak var gameOverLabel: UILabel!
    
    @IBOutlet weak var gameOverBlurBackground: UIVisualEffectView!
    @IBOutlet weak var finalScoreLabel: UILabel!
    
    var keyboardOutput = [String]()
    
    var textMessages = ["Cat", "Dog", "Racoon", "Snake", "Cow", "Monkey", "Bear", "Buffalo", "Moose", "Whale", "Giraffe", "Trout", "Worm", "Mouse", "Jonnie", "Dolphin", "Deer", "Pig", "Rhynosourous", "Chicken", "Shark", "Blobfish", "Robin", "Mockingbird", "Spirit Bear", "Stratiomyidae", "THE END"]
    
    var unusedMessages = ["I'm almost there!", "Can't talk now, I'm driving.", "Text you later.", "I'm driving right now.", "Where are you?", "I'll call you back later, I'm driving.", "See you at 8:00!", "I'll be there soon!", "I'll be thre in 5 mintues?", "Are you there yet?", "I've arrived!", "Will this app make 1 million dollars?"]
    
    var currentMesssage = 0
    
    var playerPoints = 0
    
    var seconds = 5
    var timer = Timer()
    var isTimerRunning = false
    
    var playerWon = false
    
    var capitalIsToggled = false
    var numbersIsToggled = false
    var periodPressedOnce = false
    
    override func viewDidLoad() {
        super.viewDidLoad()
       
        
        
        timerBlurBackground.layer.cornerRadius = 10
        timerBlurBackground.clipsToBounds = true
        scoreBlurBackground.layer.cornerRadius = 10
        scoreBlurBackground.clipsToBounds = true
        
        if let view = gameView {
            // Load the SKScene from 'GameScene.sks'
            if let scene = SKScene(fileNamed: "GameScene") {
                // Set the scale mode to scale to fit the window
                scene.scaleMode = .aspectFill
                game = scene as? GameScene
                game.viewController = self
                // Present the scene
                view.presentScene(scene)
            }
            
            view.ignoresSiblingOrder = true
            
            view.showsFPS = false
            view.showsNodeCount = false
            view.showsPhysics = false
        }
        
        let swipeRight = UISwipeGestureRecognizer(target: self, action: #selector(self.respondToSwipeGesture))
        swipeRight.direction = .right
        blurView.addGestureRecognizer(swipeRight)
        keyboardView.addGestureRecognizer(swipeRight)
        
        let swipeLeft = UISwipeGestureRecognizer(target: self, action: #selector(self.respondToSwipeGesture))
        swipeLeft.direction = .left
        blurView.addGestureRecognizer(swipeLeft)
        keyboardView.addGestureRecognizer(swipeLeft)
        
        for key in letterKeys {
            //            key.layer.cornerRadius = 0
            //            key.clipsToBounds = true
            let insets = UIEdgeInsets(top: 5, left: 3, bottom: 5, right: 3)
            key.imageEdgeInsets = insets
            
        }
        for key in otherKeys {
            //            key.layer.cornerRadius = 0
            //            key.clipsToBounds = true
            let insets = UIEdgeInsets(top: 5, left: 3, bottom: 5, right: 3)
            key.imageEdgeInsets = insets
        }
    }
    
    @IBAction func startButtonTapped(_ sender: UIButton) {
        self.startButton.isHidden = true
        startGame()
    }
    
    func startGame() {
        if isTimerRunning == false {
            outputLabel.text = ""
            playerPoints = 0
            currentMesssage = 0
            runTimer()
            game.startGame()
            
            placeholderLabel.text = textMessages[currentMesssage]
        }
    }
    
    func runTimer() {
        timer = Timer.scheduledTimer(timeInterval: 1, target: self, selector: (#selector(updateTimer)), userInfo: nil, repeats: true)
        isTimerRunning = true
    }
    
    @objc func updateTimer() {
        if seconds < 1 || game.isGameOver == true {
            timer.invalidate()
            isTimerRunning = false
            placeholderLabel.text = ""
            UIView.animate(withDuration: 0.5) {
                self.gameOverBlurBackground.alpha = 1.0
            }
            finalScoreLabel.text = "\(playerPoints)"
            game.gameOver()
            
        } else if textMessages.count - 1 == playerPoints {
            playerWon = true
            
            timer.invalidate()
            isTimerRunning = false
            placeholderLabel.text = ""
            UIView.animate(withDuration: 0.5) {
                self.gameOverBlurBackground.alpha = 1.0
            }
            finalScoreLabel.text = "\(playerPoints)"
            gameOverLabel.text = "You Won!"
            game.gameOver()
        } else {
            seconds -= 1
            timerLabel.text = "Time: \(seconds)"
        }
    }
    
    func checkIfCorrect() {
        
        if outputLabel.text == placeholderLabel.text {
            outputLabel.textColor = #colorLiteral(red: 0.4666666687, green: 0.7647058964, blue: 0.2666666806, alpha: 1)
            // wait...
            outputLabel.text = ""
            keyboardOutput.removeAll()
            outputLabel.textColor = #colorLiteral(red: 1, green: 1, blue: 1, alpha: 1)
            currentMesssage += 1
            playerPoints += 1
            scoreLabel.text = "Points: \(playerPoints)"
            print("Player Points: \(playerPoints)")
            placeholderLabel.text = textMessages[currentMesssage]
            
            if isTimerRunning == true {
                seconds += 5
                timerLabel.text = "Time: \(seconds)"
            }
        } else {
            outputLabel.textColor = #colorLiteral(red: 0.9254902005, green: 0.2352941185, blue: 0.1019607857, alpha: 1)
        }
    }
    
    func restart() {
        UIView.animate(withDuration: 0.5) {
            self.gameOverBlurBackground.alpha = 0.0
        }
        seconds = 5
        playerPoints = 0
        currentMesssage = 0
        scoreLabel.text = "Points: \(playerPoints)"
        timerLabel.text = "Time: \(seconds)"
        outputLabel.text = ""
        placeholderLabel.text = textMessages[currentMesssage]
        game.isGameOver = false
        game.restartGame()
        game.startGame()
        game.removeEnemy()
        runTimer()
        keyboardOutput.removeAll()
        //startGame()
    }
    
    override var shouldAutorotate: Bool {
        return true
    }
    
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
        if UIDevice.current.userInterfaceIdiom == .phone {
            return .allButUpsideDown
        } else {
            return .all
        }
    }
    
    override var prefersStatusBarHidden: Bool {
        return true
    }
    
    @IBAction func leftButtonPressed(_ sender: Any) {
        game.changeToLeftLane()
    }
    
    @IBAction func rightButtonPressed(_ sender: Any) {
        game.changeToRightLane()
    }
    @IBAction func restartButtonPressed(_ sender: Any) {
        restart()
    }
    
    @objc func respondToSwipeGesture(gesture: UIGestureRecognizer) {
        if let swipeGesture = gesture as? UISwipeGestureRecognizer {
            switch swipeGesture.direction {
            case UISwipeGestureRecognizer.Direction.right:
                game.changeToRightLane()
            case UISwipeGestureRecognizer.Direction.left:
                game.changeToLeftLane()
            default:
                break
            }
        }
    }
    
    func returnToNormalKeys() {
        letterKeys[0].setImage(UIImage.init(named: "q_3x"), for: .normal)
        letterKeys[1].setImage(UIImage.init(named: "w_3x"), for: .normal)
        letterKeys[2].setImage(UIImage.init(named: "e_3x"), for: .normal)
        letterKeys[3].setImage(UIImage.init(named: "r_3x"), for: .normal)
        letterKeys[4].setImage(UIImage.init(named: "t_3x"), for: .normal)
        letterKeys[5].setImage(UIImage.init(named: "y_3x"), for: .normal)
        letterKeys[6].setImage(UIImage.init(named: "u_3x"), for: .normal)
        letterKeys[7].setImage(UIImage.init(named: "i_3x"), for: .normal)
        letterKeys[8].setImage(UIImage.init(named: "o_3x"), for: .normal)
        letterKeys[9].setImage(UIImage.init(named: "p_3x"), for: .normal)
        letterKeys[10].setImage(UIImage.init(named: "z_3x"), for: .normal)
        letterKeys[11].setImage(UIImage.init(named: "x_3x"), for: .normal)
        letterKeys[12].setImage(UIImage.init(named: "c_3x"), for: .normal)
        letterKeys[13].setImage(UIImage.init(named: "v_3x"), for: .normal)
        letterKeys[14].setImage(UIImage.init(named: "b_3x"), for: .normal)
        letterKeys[15].setImage(UIImage.init(named: "n_3x"), for: .normal)
        letterKeys[16].setImage(UIImage.init(named: "m_3x"), for: .normal)
        letterKeys[17].setImage(UIImage.init(named: "a_3x"), for: .normal)
        letterKeys[18].setImage(UIImage.init(named: "s_3x"), for: .normal)
        letterKeys[19].setImage(UIImage.init(named: "d_3x"), for: .normal)
        letterKeys[20].setImage(UIImage.init(named: "f_3x"), for: .normal)
        letterKeys[21].setImage(UIImage.init(named: "g_3x"), for: .normal)
        letterKeys[22].setImage(UIImage.init(named: "h_3x"), for: .normal)
        letterKeys[23].setImage(UIImage.init(named: "j_3x"), for: .normal)
        letterKeys[24].setImage(UIImage.init(named: "k_3x"), for: .normal)
        letterKeys[25].setImage(UIImage.init(named: "l_3x"), for: .normal)
    }
    
    func capitalizeLettersIfNeeded() {
        
        if capitalIsToggled == true {
            otherKeys[6].setImage(UIImage.init(named: "shifttoggled"), for: .normal)
            
            letterKeys[0].setImage(UIImage.init(named: "bigq"), for: .normal)
            letterKeys[1].setImage(UIImage.init(named: "bigw"), for: .normal)
            letterKeys[2].setImage(UIImage.init(named: "bige"), for: .normal)
            letterKeys[3].setImage(UIImage.init(named: "bigr"), for: .normal)
            letterKeys[4].setImage(UIImage.init(named: "bigt"), for: .normal)
            letterKeys[5].setImage(UIImage.init(named: "bigy"), for: .normal)
            letterKeys[6].setImage(UIImage.init(named: "bigu"), for: .normal)
            letterKeys[7].setImage(UIImage.init(named: "bigi"), for: .normal)
            letterKeys[8].setImage(UIImage.init(named: "bigo"), for: .normal)
            letterKeys[9].setImage(UIImage.init(named: "bigp"), for: .normal)
            letterKeys[10].setImage(UIImage.init(named: "bigz"), for: .normal)
            letterKeys[11].setImage(UIImage.init(named: "bigx"), for: .normal)
            letterKeys[12].setImage(UIImage.init(named: "bigc"), for: .normal)
            letterKeys[13].setImage(UIImage.init(named: "bigv"), for: .normal)
            letterKeys[14].setImage(UIImage.init(named: "bigb"), for: .normal)
            letterKeys[15].setImage(UIImage.init(named: "bign"), for: .normal)
            letterKeys[16].setImage(UIImage.init(named: "bigm"), for: .normal)
            letterKeys[17].setImage(UIImage.init(named: "biga"), for: .normal)
            letterKeys[18].setImage(UIImage.init(named: "bigs"), for: .normal)
            letterKeys[19].setImage(UIImage.init(named: "bigd"), for: .normal)
            letterKeys[20].setImage(UIImage.init(named: "bigf"), for: .normal)
            letterKeys[21].setImage(UIImage.init(named: "bigg"), for: .normal)
            letterKeys[22].setImage(UIImage.init(named: "bigh"), for: .normal)
            letterKeys[23].setImage(UIImage.init(named: "bigj"), for: .normal)
            letterKeys[24].setImage(UIImage.init(named: "bigk"), for: .normal)
            letterKeys[25].setImage(UIImage.init(named: "bigl"), for: .normal)
        } else {
            otherKeys[6].setImage(UIImage.init(named: "numericBackspace_3x"), for: .normal)
            
            returnToNormalKeys()
        }
        
    }
    
    func switchToNumbers() {
        if numbersIsToggled == true {
            otherKeys[5].setImage(UIImage.init(named: "letterskey"), for: .normal)
            
            letterKeys[0].setImage(UIImage.init(named: "one"), for: .normal)
            letterKeys[1].setImage(UIImage.init(named: "two"), for: .normal)
            letterKeys[2].setImage(UIImage.init(named: "three"), for: .normal)
            letterKeys[3].setImage(UIImage.init(named: "four"), for: .normal)
            letterKeys[4].setImage(UIImage.init(named: "five"), for: .normal)
            letterKeys[5].setImage(UIImage.init(named: "six"), for: .normal)
            letterKeys[6].setImage(UIImage.init(named: "seven"), for: .normal)
            letterKeys[7].setImage(UIImage.init(named: "eight"), for: .normal)
            letterKeys[8].setImage(UIImage.init(named: "nine"), for: .normal)
            letterKeys[9].setImage(UIImage.init(named: "zero"), for: .normal)
            letterKeys[10].setImage(UIImage.init(named: "period"), for: .normal)
            letterKeys[11].setImage(UIImage.init(named: "comma"), for: .normal)
            letterKeys[12].setImage(UIImage.init(named: "questionmark"), for: .normal)
            letterKeys[13].setImage(UIImage.init(named: "exclamationmark"), for: .normal)
            letterKeys[14].setImage(UIImage.init(named: "singlequotationmark"), for: .normal)
            letterKeys[15].setImage(UIImage.init(named: "slash"), for: .normal)
            letterKeys[16].setImage(UIImage.init(named: "pound"), for: .normal)
            letterKeys[17].setImage(UIImage.init(named: "hyphen"), for: .normal)
            letterKeys[18].setImage(UIImage.init(named: "colon"), for: .normal)
            letterKeys[19].setImage(UIImage.init(named: "semicolon"), for: .normal)
            letterKeys[20].setImage(UIImage.init(named: "leftbracket"), for: .normal)
            letterKeys[21].setImage(UIImage.init(named: "rightbracket"), for: .normal)
            letterKeys[22].setImage(UIImage.init(named: "dollarsign"), for: .normal)
            letterKeys[23].setImage(UIImage.init(named: "andsign"), for: .normal)
            letterKeys[24].setImage(UIImage.init(named: "atsign"), for: .normal)
            letterKeys[25].setImage(UIImage.init(named: "quotationmarks"), for: .normal)
        } else {
            otherKeys[5].setImage(UIImage.init(named: "123keys"), for: .normal)
            
            returnToNormalKeys()
        }
    }
    
    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        
        checkIfCorrect()
        return true
    }
    
    
    @IBAction func qKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        if capitalIsToggled == true {
            keyboardOutput.append("Q")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else if numbersIsToggled == true {
            keyboardOutput.append("1")
            switchToNumbers()
        } else {
            keyboardOutput.append("q")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func wKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        if capitalIsToggled == true {
            keyboardOutput.append("W")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else if numbersIsToggled == true {
            keyboardOutput.append("2")
            switchToNumbers()
        } else {
            keyboardOutput.append("w")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func eKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        if capitalIsToggled == true {
            keyboardOutput.append("E")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else if numbersIsToggled == true {
            keyboardOutput.append("3")
            switchToNumbers()
        } else {
            keyboardOutput.append("e")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func rKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        if capitalIsToggled == true {
            keyboardOutput.append("R")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else if numbersIsToggled == true {
            keyboardOutput.append("4")
            switchToNumbers()
        } else {
            keyboardOutput.append("r")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func tKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        if capitalIsToggled == true {
            keyboardOutput.append("T")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else if numbersIsToggled == true {
            keyboardOutput.append("5")
            switchToNumbers()
        } else {
            keyboardOutput.append("t")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func yKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        if capitalIsToggled == true {
            keyboardOutput.append("Y")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else if numbersIsToggled == true {
            keyboardOutput.append("6")
            switchToNumbers()
        } else {
            keyboardOutput.append("y")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func uKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        if capitalIsToggled == true {
            keyboardOutput.append("U")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else if numbersIsToggled == true {
            keyboardOutput.append("7")
            switchToNumbers()
        } else {
            keyboardOutput.append("u")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func iKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        if capitalIsToggled == true {
            keyboardOutput.append("I")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else if numbersIsToggled == true {
            keyboardOutput.append("8")
            switchToNumbers()
        } else {
            keyboardOutput.append("i")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func oKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        if capitalIsToggled == true {
            keyboardOutput.append("O")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else if numbersIsToggled == true {
            keyboardOutput.append("9")
            switchToNumbers()
        } else {
            keyboardOutput.append("o")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func pKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        if capitalIsToggled == true {
            keyboardOutput.append("P")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else if numbersIsToggled == true {
            keyboardOutput.append("0")
            switchToNumbers()
        } else {
            keyboardOutput.append("p")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func aKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        if capitalIsToggled == true {
            keyboardOutput.append("A")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else if numbersIsToggled == true {
            keyboardOutput.append("-")
            switchToNumbers()
        } else {
            keyboardOutput.append("a")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func sKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        if capitalIsToggled == true {
            keyboardOutput.append("S")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else if numbersIsToggled == true {
            keyboardOutput.append(":")
            switchToNumbers()
        } else {
            keyboardOutput.append("s")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func dKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        if capitalIsToggled == true {
            keyboardOutput.append("D")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else if numbersIsToggled == true {
            keyboardOutput.append(";")
            switchToNumbers()
        } else {
            keyboardOutput.append("d")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func fKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        if capitalIsToggled == true {
            keyboardOutput.append("F")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else if numbersIsToggled == true {
            keyboardOutput.append("(")
            switchToNumbers()
        } else {
            keyboardOutput.append("f")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func gKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        if capitalIsToggled == true {
            keyboardOutput.append("G")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else if numbersIsToggled == true {
            keyboardOutput.append(")")
            switchToNumbers()
        } else {
            keyboardOutput.append("g")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func hKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        if capitalIsToggled == true {
            keyboardOutput.append("H")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else if numbersIsToggled == true {
            keyboardOutput.append("$")
            switchToNumbers()
        } else {
            keyboardOutput.append("h")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func jKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        if capitalIsToggled == true {
            keyboardOutput.append("J")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else if numbersIsToggled == true {
            keyboardOutput.append("&")
            switchToNumbers()
        } else {
            keyboardOutput.append("j")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func kKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        if capitalIsToggled == true {
            keyboardOutput.append("K")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else if numbersIsToggled == true {
            keyboardOutput.append("@")
            switchToNumbers()
        } else {
            keyboardOutput.append("k")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func lKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        if capitalIsToggled == true {
            keyboardOutput.append("L")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else if numbersIsToggled == true {
            keyboardOutput.append("""
 "
 """)
            switchToNumbers()
        } else {
            keyboardOutput.append("l")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func capitalizeKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        capitalIsToggled.toggle()
        capitalizeLettersIfNeeded()
    }
    @IBAction func zKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        if capitalIsToggled == true {
            keyboardOutput.append("Z")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else if numbersIsToggled == true {
            keyboardOutput.append(".")
            switchToNumbers()
        } else {
            keyboardOutput.append("z")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func xKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        if capitalIsToggled == true {
            keyboardOutput.append("X")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else if numbersIsToggled == true {
            keyboardOutput.append(",")
            switchToNumbers()
        } else {
            keyboardOutput.append("x")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func cKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        if capitalIsToggled == true {
            keyboardOutput.append("C")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else if numbersIsToggled == true {
            keyboardOutput.append("?")
            switchToNumbers()
        } else {
            keyboardOutput.append("c")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func vKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        if capitalIsToggled == true {
            keyboardOutput.append("V")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else if numbersIsToggled == true {
            keyboardOutput.append("!")
            switchToNumbers()
        } else {
            keyboardOutput.append("v")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func bKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        if capitalIsToggled == true {
            keyboardOutput.append("B")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else if numbersIsToggled == true {
            keyboardOutput.append("'")
            switchToNumbers()
        } else {
            keyboardOutput.append("b")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func nKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        if capitalIsToggled == true {
            keyboardOutput.append("N")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else if numbersIsToggled == true {
            keyboardOutput.append("/")
            switchToNumbers()
        } else {
            keyboardOutput.append("n")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func mKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        if capitalIsToggled == true {
            keyboardOutput.append("M")
            capitalIsToggled.toggle()
            capitalizeLettersIfNeeded()
        } else if numbersIsToggled == true {
            keyboardOutput.append("#")
            switchToNumbers()
        } else {
            keyboardOutput.append("m")
        }
        outputLabel.text = "\(keyboardOutput.joined())"
    }
    @IBAction func backspaceKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
        if keyboardOutput.count > 0 {
            keyboardOutput.removeLast()
            outputLabel.text = "\(keyboardOutput.joined())"
            if periodPressedOnce == true {
                periodPressedOnce = false
            }
        } else {
            print("Can't remove last item.")
        }
    }
    @IBAction func numbersKeyPressed(_ sender: Any) {
        numbersIsToggled.toggle()
        switchToNumbers()
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
    }
    @IBAction func emojisKeyPressed(_ sender: Any) {
        keyboardOutput.append("*EMOJI*")
        outputLabel.text = "\(keyboardOutput.joined())"
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
    }
    @IBAction func microphoneKeyPressed(_ sender: Any) {
        keyboardOutput.append("*MICROPHONE*")
        outputLabel.text = "\(keyboardOutput.joined())"
        if periodPressedOnce == true {
            periodPressedOnce = false
        }
    }
    @IBAction func spaceKeyPressed(_ sender: Any) {
        if periodPressedOnce == true {
            keyboardOutput.removeLast()
            periodPressedOnce = false
            keyboardOutput.append(". ")
        } else {
            keyboardOutput.append(" ")
            outputLabel.text = "\(keyboardOutput.joined())"
            periodPressedOnce = true
        }
        
    }
    @IBAction func returnKeyPressed(_ sender: Any) {
//        keyboardOutput.append("*RETURN*")
//        outputLabel.text = "\(keyboardOutput.joined())"
//        if periodPressedOnce == true {
//            periodPressedOnce = false
//        }
        checkIfCorrect()
    }
    
    
    
    
    
}

